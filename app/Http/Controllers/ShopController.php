<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ShopController extends Controller
{
    public function index(Request $request): Response
    {
        $category = trim((string) $request->query('category', ''));
        $search = trim((string) $request->query('search', ''));
        $brand = trim((string) $request->query('brand', ''));
        $model = trim((string) $request->query('model', ''));
        $color = trim((string) $request->query('color', ''));
        $productType = trim((string) $request->query('product_type', ''));
        $clothingSize = strtoupper(trim((string) $request->query('clothing_size', '')));
        $shoeSize = trim((string) $request->query('shoe_size', ''));
        $minPrice = $this->normalizePrice($request->query('min_price'));
        $maxPrice = $this->normalizePrice($request->query('max_price'));

        if ($minPrice !== null && $maxPrice !== null && $minPrice > $maxPrice) {
            [$minPrice, $maxPrice] = [$maxPrice, $minPrice];
        }

        $products = Product::query()
            ->select([
                'id',
                'name',
                'brand',
                'model_name',
                'color',
                'product_type',
                'available_clothing_sizes',
                'available_shoe_sizes',
                'slug',
                'description',
                'price',
                'compare_at_price',
                'stock',
                'is_active',
            ])
            ->with([
                'primaryImage:id,product_id,disk,path,alt',
                'primaryCategory:id,name,slug',
            ])
            ->where('is_active', true)
            ->when($category !== '', function ($query) use ($category): void {
                $query->whereHas('categories', fn ($categoryQuery) => $categoryQuery->where('slug', $category));
            })
            ->when($search !== '', fn ($query) => $query->where('name', 'like', '%'.$search.'%'))
            ->when($brand !== '', fn ($query) => $query->where('brand', $brand))
            ->when($model !== '', fn ($query) => $query->where('model_name', $model))
            ->when($color !== '', fn ($query) => $query->where('color', $color))
            ->when($productType !== '', fn ($query) => $query->where('product_type', $productType))
            ->when($clothingSize !== '', fn ($query) => $query->whereJsonContains('available_clothing_sizes', $clothingSize))
            ->when($shoeSize !== '', fn ($query) => $query->whereJsonContains('available_shoe_sizes', $shoeSize))
            ->when($minPrice !== null, fn ($query) => $query->where('price', '>=', $minPrice))
            ->when($maxPrice !== null, fn ($query) => $query->where('price', '<=', $maxPrice))
            ->orderBy('name')
            ->paginate(9)
            ->withQueryString()
            ->through(fn (Product $product): array => [
                'id' => (int) $product->id,
                'name' => (string) $product->name,
                'brand' => $product->brand !== null ? (string) $product->brand : null,
                'model_name' => $product->model_name !== null ? (string) $product->model_name : null,
                'color' => $product->color !== null ? (string) $product->color : null,
                'product_type' => $product->product_type !== null ? (string) $product->product_type : null,
                'slug' => (string) $product->slug,
                'description' => $product->description,
                'price' => (float) $product->price,
                'compare_at_price' => $product->compare_at_price !== null
                    ? (float) $product->compare_at_price
                    : null,
                'stock' => (int) $product->stock,
                'image_url' => $this->resolveImageUrl($product),
                'has_size_options' => ! empty($this->normalizeStringArray($product->available_clothing_sizes, true))
                    || ! empty($this->normalizeStringArray($product->available_shoe_sizes)),
                'primary_category' => $product->primaryCategory === null ? null : [
                    'name' => (string) $product->primaryCategory->name,
                    'slug' => (string) $product->primaryCategory->slug,
                ],
            ]);

        $brands = collect(Product::brandOptions())->values();
        $models = collect(Product::modelOptions())->values();
        $colors = collect(Product::colorOptions())->values();
        $productTypes = collect(Product::productTypes())->values();
        $clothingSizes = collect(Product::clothingSizeOptions())->values();
        $shoeSizes = collect(Product::shoeSizeOptions())->values();

        $categories = Category::query()
            ->select(['id', 'name', 'slug'])
            ->where('is_active', true)
            ->whereHas('products', fn ($query) => $query->where('is_active', true))
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category): array => [
                'id' => (int) $category->id,
                'name' => (string) $category->name,
                'slug' => (string) $category->slug,
            ])
            ->values();

        return Inertia::render('shop/index', [
            'products' => $products,
            'categories' => $categories,
            'filter_options' => [
                'brands' => $brands,
                'models' => $models,
                'colors' => $colors,
                'product_types' => $productTypes,
                'clothing_sizes' => $clothingSizes,
                'shoe_sizes' => $shoeSizes,
            ],
            'filters' => [
                'category' => $category,
                'search' => $search,
                'brand' => $brand,
                'model' => $model,
                'color' => $color,
                'product_type' => $productType,
                'clothing_size' => $clothingSize,
                'shoe_size' => $shoeSize,
                'min_price' => $minPrice,
                'max_price' => $maxPrice,
            ],
        ]);
    }

    public function show(Product $product): Response
    {
        abort_unless($product->is_active, 404);

        $product->load([
            'images' => fn ($query) => $query
                ->select(['id', 'product_id', 'disk', 'path', 'alt', 'sort_order', 'is_primary'])
                ->orderByDesc('is_primary')
                ->orderBy('sort_order')
                ->orderBy('id'),
        ]);

        return Inertia::render('shop/view', [
            'product' => [
                'id' => (int) $product->id,
                'slug' => (string) $product->slug,
                'name' => (string) $product->name,
                'brand' => $product->brand !== null ? (string) $product->brand : null,
                'model_name' => $product->model_name !== null ? (string) $product->model_name : null,
                'product_type' => $product->product_type !== null ? (string) $product->product_type : null,
                'color' => $product->color !== null ? (string) $product->color : null,
                'material' => $product->material !== null ? (string) $product->material : null,
                'available_clothing_sizes' => $this->normalizeStringArray($product->available_clothing_sizes, true),
                'available_shoe_sizes' => $this->normalizeStringArray($product->available_shoe_sizes),
                'description' => $product->description,
                'price' => (float) $product->price,
                'compare_at_price' => $product->compare_at_price !== null
                    ? (float) $product->compare_at_price
                    : null,
                'stock' => (int) $product->stock,
                'images' => $product->images
                    ->map(fn (ProductImage $image): array => [
                        'id' => (int) $image->id,
                        'image_url' => $this->resolveProductImageUrl($image),
                        'alt' => $image->alt,
                        'is_primary' => (bool) $image->is_primary,
                    ])
                    ->values(),
            ],
        ]);
    }

    private function resolveImageUrl(Product $product): ?string
    {
        $image = $product->primaryImage;

        if ($image === null || $image->path === null) {
            return null;
        }

        return Storage::disk($image->disk ?: 'public')->url($image->path);
    }

    private function resolveProductImageUrl(ProductImage $image): string
    {
        return Storage::disk($image->disk ?: 'public')->url((string) $image->path);
    }

    private function normalizePrice(mixed $value): ?float
    {
        if (! is_scalar($value)) {
            return null;
        }

        $normalized = trim((string) $value);

        if ($normalized === '' || ! is_numeric($normalized)) {
            return null;
        }

        $price = (float) $normalized;

        return $price >= 0 ? $price : null;
    }

    /**
     * @return array<int, string>
     */
    private function normalizeStringArray(mixed $value, bool $uppercase = false): array
    {
        if (! is_array($value)) {
            return [];
        }

        return collect($value)
            ->filter(fn ($item): bool => is_scalar($item))
            ->map(fn ($item): string => trim((string) $item))
            ->filter(fn (string $item): bool => $item !== '')
            ->map(fn (string $item): string => $uppercase ? strtoupper($item) : $item)
            ->unique()
            ->values()
            ->all();
    }
}
