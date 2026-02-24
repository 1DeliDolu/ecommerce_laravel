<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('can:viewAny,'.Product::class, only: ['index']),
            new Middleware('can:create,'.Product::class, only: ['create', 'store']),
            new Middleware('can:view,product', only: ['show']),
            new Middleware('can:update,product', only: ['edit', 'update']),
            new Middleware('can:delete,product', only: ['destroy']),
        ];
    }

    public function index(Request $request): Response
    {
        $q = (string) $request->query('q', '');
        $status = (string) $request->query('status', 'all'); // all|active|inactive
        $category = (string) $request->query('category', ''); // category slug
        $stock = (string) $request->query('stock', 'all'); // all|in|out

        $products = Product::query()
            ->with([
                'categories:id,name,slug',
                'primaryImage:id,product_id,disk,path,alt,sort_order,is_primary',
            ])
            ->withCount('images')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', '%'.$q.'%')
                        ->orWhere('slug', 'like', '%'.$q.'%')
                        ->orWhere('sku', 'like', '%'.$q.'%');
                });
            })
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($stock === 'in', fn ($query) => $query->where('stock', '>', 0))
            ->when($stock === 'out', fn ($query) => $query->where('stock', '=', 0))
            ->when($category !== '', function ($query) use ($category) {
                $query->whereHas('categories', fn ($q) => $q->where('slug', $category));
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $categories = Category::query()
            ->select(['id', 'name', 'slug', 'parent_id'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'q' => $q,
                'status' => $status,
                'category' => $category,
                'stock' => $stock,
            ],
        ]);
    }

    public function create(): Response
    {
        $categories = Category::query()
            ->select(['id', 'name', 'slug', 'parent_id'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/products/create', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);

        return DB::transaction(function () use ($validated) {
            $productData = Arr::only($validated, [
                'name',
                'slug',
                'description',
                'price',
                'compare_at_price',
                'sku',
                'stock',
                'primary_category_id',
                'is_active',
            ]);

            $baseSlug = $productData['slug'] !== null && $productData['slug'] !== ''
                ? $productData['slug']
                : $productData['name'];

            $productData['slug'] = $this->makeUniqueSlug($baseSlug);
            $productData['primary_category_id'] = $this->resolvePrimaryCategoryId($validated);

            /** @var Product $product */
            $product = Product::query()->create($productData);

            $product->categories()->sync($validated['category_ids']);

            if (! empty($validated['images'])) {
                $images = $this->normalizeImages($validated['images']);
                $product->images()->createMany($images);
            }

            return redirect()
                ->route('admin.products.show', $product)
                ->with('success', 'Product created.');
        });
    }

    public function show(Product $product): Response
    {
        $product->load([
            'categories:id,name,slug',
            'images:id,product_id,disk,path,alt,sort_order,is_primary',
        ]);

        return Inertia::render('admin/products/show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product): Response
    {
        $product->load([
            'categories:id',
            'images:id,product_id,disk,path,alt,sort_order,is_primary',
        ]);

        $categories = Category::query()
            ->select(['id', 'name', 'slug', 'parent_id'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => $categories,
            'selectedCategoryIds' => $product->categories->pluck('id')->all(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $this->validatePayload($request, $product);

        return DB::transaction(function () use ($validated, $product) {
            $productData = Arr::only($validated, [
                'name',
                'slug',
                'description',
                'price',
                'compare_at_price',
                'sku',
                'stock',
                'primary_category_id',
                'is_active',
            ]);

            // Keep slug stable unless explicitly provided.
            if ($productData['slug'] !== null && $productData['slug'] !== '') {
                $productData['slug'] = $this->makeUniqueSlug($productData['slug'], $product->id);
            } else {
                unset($productData['slug']);
            }

            $productData['primary_category_id'] = $this->resolvePrimaryCategoryId($validated);

            $product->update($productData);

            $product->categories()->sync($validated['category_ids']);

            // If images are provided, replace all images (soft delete old ones).
            if (array_key_exists('images', $validated) && is_array($validated['images'])) {
                $product->images()->delete();

                if (! empty($validated['images'])) {
                    $images = $this->normalizeImages($validated['images']);
                    $product->images()->createMany($images);
                }
            }

            return redirect()
                ->route('admin.products.show', $product)
                ->with('success', 'Product updated.');
        });
    }

    public function destroy(Product $product): RedirectResponse
    {
        return DB::transaction(function () use ($product) {
            // Soft delete images as well so they don't show up in UI.
            $product->images()->delete();
            $product->delete();

            return redirect()
                ->route('admin.products.index')
                ->with('success', 'Product deleted.');
        });
    }

    private function validatePayload(Request $request, ?Product $product = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],

            // Slug is optional; we generate from name if empty on create.
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('products', 'slug')->ignore($product?->id),
            ],

            'description' => ['nullable', 'string'],

            'price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0', 'gte:price'],

            'sku' => [
                'nullable',
                'string',
                'max:64',
                Rule::unique('products', 'sku')->ignore($product?->id),
            ],

            'stock' => ['required', 'integer', 'min:0'],
            'is_active' => ['required', 'boolean'],

            // Categories (pivot)
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['integer', Rule::exists('categories', 'id')],
            'primary_category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')],

            // Images (optional for now; later we will handle uploads)
            'images' => ['sometimes', 'array'],
            'images.*.disk' => ['nullable', 'string', 'max:64'],
            'images.*.path' => ['required_with:images', 'string', 'max:2048'],
            'images.*.alt' => ['nullable', 'string', 'max:255'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'images.*.is_primary' => ['nullable', 'boolean'],
        ]);
    }

    private function resolvePrimaryCategoryId(array $validated): int
    {
        $categoryIds = array_values(array_map('intval', $validated['category_ids']));
        $requestedPrimary = isset($validated['primary_category_id'])
            ? (int) $validated['primary_category_id']
            : null;

        if ($requestedPrimary !== null && in_array($requestedPrimary, $categoryIds, true)) {
            return $requestedPrimary;
        }

        return $categoryIds[0];
    }

    private function makeUniqueSlug(string $value, ?int $ignoreId = null): string
    {
        $base = Str::slug($value);
        $slug = $base;
        $i = 2;

        while (
            Product::query()
                ->when($ignoreId !== null, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base.'-'.$i;
            $i++;
        }

        return $slug;
    }

    /**
     * Normalize images payload:
     * - Ensure exactly one primary image (first image if none explicitly marked).
     * - Fill missing sort_order with array index order.
     */
    private function normalizeImages(array $images): array
    {
        $normalized = [];
        $primaryIndex = null;

        foreach (array_values($images) as $idx => $img) {
            $isPrimary = (bool) ($img['is_primary'] ?? false);

            if ($primaryIndex === null && $isPrimary) {
                $primaryIndex = $idx;
            }

            $normalized[] = [
                'disk' => (string) ($img['disk'] ?? 'public'),
                'path' => (string) ($img['path'] ?? ''),
                'alt' => $img['alt'] ?? null,
                'sort_order' => isset($img['sort_order']) ? (int) $img['sort_order'] : $idx,
                'is_primary' => $isPrimary,
            ];
        }

        if (! empty($normalized)) {
            if ($primaryIndex === null) {
                $primaryIndex = 0;
            }

            foreach ($normalized as $i => $row) {
                $normalized[$i]['is_primary'] = $i === $primaryIndex;
            }
        }

        return $normalized;
    }
}
