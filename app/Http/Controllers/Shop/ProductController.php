<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $category = (string) $request->query('category', '');

        $query = Product::query()
            ->where('is_active', true)
            ->with([
                'primaryImage:id,product_id,disk,path,alt,is_primary',
                'categories:id,name,slug',
            ]);

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('name', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%");
            });
        }

        if ($category !== '') {
            $query->whereHas('categories', fn ($q) => $q->where('slug', $category));
        }

        $products = $query
            ->orderByDesc('id')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('shop/products/index', [
            'products' => $products,
            'filters' => ['q' => $q, 'category' => $category],
        ]);
    }

    public function show(string $slug): Response
    {
        $product = Product::query()
            ->where('is_active', true)
            ->where('slug', $slug)
            ->with([
                'images' => fn ($q) => $q->orderByDesc('is_primary')->orderBy('sort_order'),
                'categories:id,name,slug',
            ])
            ->firstOrFail();

        return Inertia::render('shop/products/show', [
            'product' => $product,
        ]);
    }
}
