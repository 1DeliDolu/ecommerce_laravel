<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductRequest;
use App\Http\Requests\Admin\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $q = (string) $request->query('q', '');
        $status = (string) $request->query('status', 'all');
        $category = (string) $request->query('category', '');
        $stock = (string) $request->query('stock', 'all');

        $query = Product::query()
            ->with([
                'categories:id,name,slug',
                'primaryImage:id,product_id,disk,path,alt,sort_order,is_primary',
            ])
            ->withCount('images');

        if ($status === 'trashed') {
            $query->onlyTrashed();
        } elseif ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'inactive') {
            $query->where('is_active', false);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', '%'.$q.'%')
                    ->orWhere('slug', 'like', '%'.$q.'%')
                    ->orWhere('sku', 'like', '%'.$q.'%');
            });
        }

        if ($stock === 'in') {
            $query->where('stock', '>', 0);
        } elseif ($stock === 'out') {
            $query->where('stock', '=', 0);
        }

        if ($category !== '') {
            $query->whereHas('categories', fn ($q) => $q->where('slug', $category));
        }

        $products = $query
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
        $this->authorize('create', Product::class);

        $categories = Category::query()
            ->select(['id', 'name', 'slug', 'parent_id'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/products/create', [
            'categories' => $categories,
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $this->authorize('create', Product::class);

        $data = $request->validated();

        $product = null;

        DB::transaction(function () use ($data, &$product) {
            $slugInput = trim((string) ($data['slug'] ?? ''));
            $baseSlug = $slugInput !== '' ? $slugInput : (string) $data['name'];
            $slug = $this->generateUniqueSlug($baseSlug);

            $product = Product::create([
                'name' => $data['name'],
                'slug' => $slug,
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'compare_at_price' => $data['compare_at_price'] ?? null,
                'sku' => $data['sku'] ?? null,
                'stock' => $data['stock'] ?? 0,
                'is_active' => (bool) ($data['is_active'] ?? false),
            ]);

            $product->categories()->sync($data['category_ids'] ?? []);
        });

        return redirect()
            ->route('admin.products.edit', $product)
            ->with('success', 'Product created successfully. You can now upload images.');
    }

    public function show(Product $product): Response
    {
        $this->authorize('view', $product);

        $product->load([
            'categories:id,name,slug',
            'images' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('id'),
        ]);

        return Inertia::render('admin/products/show', [
            'product' => $product,
        ]);
    }

    public function edit(Product $product): Response
    {
        $this->authorize('update', $product);

        $product->load([
            'categories:id',
            'images' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('id'),
        ]);

        $trashedImages = $product->images()
            ->onlyTrashed()
            ->orderBy('id')
            ->get();

        $categories = Category::query()
            ->select(['id', 'name', 'slug', 'parent_id'])
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/products/edit', [
            'product' => $product,
            'categories' => $categories,
            'selectedCategoryIds' => $product->categories->pluck('id')->all(),
            'trashedImages' => $trashedImages,
        ]);
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $this->authorize('update', $product);

        $data = $request->validated();

        DB::transaction(function () use ($data, $product) {
            $slugInput = trim((string) ($data['slug'] ?? ''));

            // Slug stability: only update slug if admin explicitly provides a new one.
            if ($slugInput !== '') {
                $product->slug = $this->generateUniqueSlug($slugInput, $product->id);
            }

            $product->fill([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'price' => $data['price'],
                'compare_at_price' => $data['compare_at_price'] ?? null,
                'sku' => $data['sku'] ?? null,
                'stock' => $data['stock'] ?? 0,
                'is_active' => (bool) ($data['is_active'] ?? false),
            ])->save();

            $product->categories()->sync($data['category_ids'] ?? []);
        });

        return back()->with('success', 'Product updated successfully.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        $product->delete();

        return redirect()
            ->route('admin.products.index')
            ->with('success', 'Product deleted successfully.');
    }

    private function generateUniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = Str::slug($base);
        $original = $slug;
        $i = 2;

        while (
            Product::withTrashed()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$original}-{$i}";
            $i++;
        }

        return $slug;
    }
}
