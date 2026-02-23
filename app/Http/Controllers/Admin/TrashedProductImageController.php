<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TrashedProductImageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', ProductImage::class);

        $q = (string) $request->query('q', '');

        $images = ProductImage::onlyTrashed()
            ->with('product:id,name,slug')
            ->when($q !== '', fn ($query) => $query->whereHas(
                'product',
                fn ($sub) => $sub->where('name', 'like', "%{$q}%")
            ))
            ->orderByDesc('deleted_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/product-images/trashed', [
            'images' => $images,
            'filters' => ['q' => $q],
        ]);
    }
}
