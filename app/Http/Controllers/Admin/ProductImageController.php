<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductImage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductImageController extends Controller
{
    public function trashed(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));

        $images = ProductImage::query()
            ->onlyTrashed()
            ->with([
                'product' => fn ($query) => $query
                    ->withTrashed()
                    ->select(['id', 'name', 'slug']),
            ])
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('path', 'like', "%{$q}%")
                        ->orWhere('alt', 'like', "%{$q}%")
                        ->orWhereHas('product', function ($productQuery) use ($q) {
                            $productQuery
                                ->withTrashed()
                                ->where(function ($productSub) use ($q) {
                                    $productSub->where('name', 'like', "%{$q}%")
                                        ->orWhere('slug', 'like', "%{$q}%");
                                });
                        });
                });
            })
            ->orderByDesc('deleted_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/product-images/trashed', [
            'images' => $images,
            'filters' => [
                'q' => $q,
            ],
        ]);
    }

    public function restore(ProductImage $productImage): RedirectResponse
    {
        if (! $productImage->trashed()) {
            return back()->with('info', 'Image is not trashed.');
        }

        $productImage->restore();

        return back()->with('success', 'Image restored.');
    }

    public function forceDelete(ProductImage $productImage): RedirectResponse
    {
        if (! $productImage->trashed()) {
            return back()->with('info', 'Image is not trashed.');
        }

        $productImage->forceDelete();

        return back()->with('success', 'Image permanently deleted.');
    }
}
