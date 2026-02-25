<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
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
        $brand = trim((string) $request->query('brand', ''));
        $model = trim((string) $request->query('model', ''));
        $productType = trim((string) $request->query('product_type', ''));

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
                        ->orWhere('sku', 'like', '%'.$q.'%')
                        ->orWhere('brand', 'like', '%'.$q.'%')
                        ->orWhere('model_name', 'like', '%'.$q.'%');
                });
            })
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($stock === 'in', fn ($query) => $query->where('stock', '>', 0))
            ->when($stock === 'out', fn ($query) => $query->where('stock', '=', 0))
            ->when($brand !== '', fn ($query) => $query->where('brand', 'like', '%'.$brand.'%'))
            ->when($model !== '', fn ($query) => $query->where('model_name', 'like', '%'.$model.'%'))
            ->when($productType !== '', fn ($query) => $query->where('product_type', $productType))
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
                'brand' => $brand,
                'model' => $model,
                'product_type' => $productType,
            ],
            'catalog_options' => $this->catalogOptions(),
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
            'catalog_options' => $this->catalogOptions(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validatePayload($request);
        $uploadedImages = $this->storeUploadedImages($request);

        return DB::transaction(function () use ($validated, $uploadedImages) {
            $productData = Arr::only($validated, [
                'name',
                'brand',
                'model_name',
                'product_type',
                'color',
                'material',
                'available_clothing_sizes',
                'available_shoe_sizes',
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
            $productData['available_clothing_sizes'] = $this->normalizeOptionSelections(
                $validated['available_clothing_sizes'] ?? [],
                Product::clothingSizeOptions(),
            );
            $productData['available_shoe_sizes'] = $this->normalizeOptionSelections(
                $validated['available_shoe_sizes'] ?? [],
                Product::shoeSizeOptions(),
            );

            /** @var Product $product */
            $product = Product::query()->create($productData);

            $product->categories()->sync($validated['category_ids']);

            $providedImages = is_array($validated['images'] ?? null)
                ? $validated['images']
                : [];
            $imagesPayload = [...$providedImages, ...$uploadedImages];

            if (! empty($imagesPayload)) {
                $images = $this->normalizeImages($imagesPayload);
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
            'catalog_options' => $this->catalogOptions(),
        ]);
    }

    public function update(Request $request, Product $product): RedirectResponse
    {
        $validated = $this->validatePayload($request, $product);
        $uploadedImages = $this->storeUploadedImages($request);

        return DB::transaction(function () use ($validated, $uploadedImages, $product) {
            $productData = Arr::only($validated, [
                'name',
                'brand',
                'model_name',
                'product_type',
                'color',
                'material',
                'available_clothing_sizes',
                'available_shoe_sizes',
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
            $productData['available_clothing_sizes'] = $this->normalizeOptionSelections(
                $validated['available_clothing_sizes'] ?? [],
                Product::clothingSizeOptions(),
            );
            $productData['available_shoe_sizes'] = $this->normalizeOptionSelections(
                $validated['available_shoe_sizes'] ?? [],
                Product::shoeSizeOptions(),
            );

            $product->update($productData);

            $product->categories()->sync($validated['category_ids']);

            // If images are provided, replace all images (soft delete old ones).
            $hasImagePayload = array_key_exists('images', $validated) || ! empty($uploadedImages);

            if ($hasImagePayload) {
                $product->images()->delete();

                $providedImages = is_array($validated['images'] ?? null)
                    ? $validated['images']
                    : [];
                $imagesPayload = [...$providedImages, ...$uploadedImages];

                if (! empty($uploadedImages)) {
                    $imagesPayload = array_map(function (array $image): array {
                        $image['is_primary'] = false;

                        return $image;
                    }, $imagesPayload);

                    $firstUploadedIndex = count($providedImages);

                    if (isset($imagesPayload[$firstUploadedIndex])) {
                        $imagesPayload[$firstUploadedIndex]['is_primary'] = true;
                    }
                }

                if (! empty($imagesPayload)) {
                    $images = $this->normalizeImages($imagesPayload);
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
            'brand' => ['nullable', Rule::in(Product::brandOptions())],
            'model_name' => ['nullable', Rule::in(Product::modelOptions())],
            'product_type' => ['nullable', 'string', Rule::in(Product::productTypes())],
            'color' => ['nullable', Rule::in(Product::colorOptions())],
            'material' => ['nullable', 'string', 'max:120'],
            'available_clothing_sizes' => ['nullable', 'array', 'max:20'],
            'available_clothing_sizes.*' => ['string', Rule::in(Product::clothingSizeOptions())],
            'available_shoe_sizes' => ['nullable', 'array', 'max:20'],
            'available_shoe_sizes.*' => ['string', Rule::in(Product::shoeSizeOptions())],

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

            // Existing image rows + uploaded files
            'images' => ['sometimes', 'array'],
            'images.*.disk' => ['nullable', 'string', 'max:64'],
            'images.*.path' => ['required_with:images', 'string', 'max:2048'],
            'images.*.alt' => ['nullable', 'string', 'max:255'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'images.*.is_primary' => ['nullable', 'boolean'],

            'uploaded_images' => ['sometimes', 'array'],
            'uploaded_images.*' => ['file', 'image', 'max:5120'],
        ]);
    }

    /**
     * @return array{
     *     brands: list<string>,
     *     models: list<string>,
     *     colors: list<string>,
     *     product_types: list<string>,
     *     clothing_sizes: list<string>,
     *     shoe_sizes: list<string>
     * }
     */
    private function catalogOptions(): array
    {
        return [
            'brands' => Product::brandOptions(),
            'models' => Product::modelOptions(),
            'colors' => Product::colorOptions(),
            'product_types' => Product::productTypes(),
            'clothing_sizes' => Product::clothingSizeOptions(),
            'shoe_sizes' => Product::shoeSizeOptions(),
        ];
    }

    private function storeUploadedImages(Request $request): array
    {
        $files = $request->file('uploaded_images', []);

        if (! is_array($files)) {
            return [];
        }

        $storedImages = [];

        foreach ($files as $file) {
            if (! $file instanceof UploadedFile || ! $file->isValid()) {
                continue;
            }

            $storedImages[] = [
                'disk' => 'public',
                'path' => $file->storePublicly('products', 'public'),
                'alt' => null,
                'is_primary' => false,
            ];
        }

        return $storedImages;
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

    /**
     * @param  list<string>|array<int, string>  $inputValues
     * @param  list<string>  $allowedValues
     * @return list<string>|null
     */
    private function normalizeOptionSelections(array $inputValues, array $allowedValues): ?array
    {
        $allowedMap = collect($allowedValues)
            ->mapWithKeys(static fn (string $value): array => [$value => true]);

        $values = collect($inputValues)
            ->filter(static fn (mixed $value): bool => is_string($value))
            ->map(static fn (string $value): string => trim($value))
            ->filter(static fn (string $value): bool => $value !== '')
            ->filter(static fn (string $value): bool => $allowedMap->has($value))
            ->unique()
            ->values()
            ->all();

        return count($values) > 0 ? $values : null;
    }
}
