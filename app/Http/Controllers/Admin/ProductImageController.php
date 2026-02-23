<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ForceDeleteProductImageRequest;
use App\Http\Requests\Admin\RestoreProductImageRequest;
use App\Http\Requests\Admin\StoreProductImageRequest;
use App\Http\Requests\Admin\UpdateProductImageRequest;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageStorageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ProductImageController extends Controller
{
    public function store(
        StoreProductImageRequest $request,
        Product $product,
        ProductImageStorageService $storage
    ): RedirectResponse {
        $files = $request->file('images', []);
        $storedPaths = [];

        try {
            foreach ($files as $file) {
                $storedPaths[] = $storage->storeForProduct($file, $product->id);
            }

            DB::transaction(function () use ($product, $storedPaths) {
                $hasPrimary = $product->images()->where('is_primary', true)->exists();

                foreach ($storedPaths as $index => $path) {
                    $product->images()->create([
                        'path' => $path,
                        'is_primary' => (! $hasPrimary && $index === 0),
                    ]);
                }
            });

            return back()->with('success', 'Images uploaded successfully.');
        } catch (\RuntimeException $e) {
            foreach ($storedPaths as $path) {
                $storage->delete($path);
            }

            return back()->with('error', $e->getMessage());
        } catch (\Throwable $e) {
            foreach ($storedPaths as $path) {
                $storage->delete($path);
            }

            return back()->with('error', 'Image upload failed. Please try again.');
        }
    }

    public function update(
        UpdateProductImageRequest $request,
        ProductImage $productImage
    ): RedirectResponse {
        $data = $request->validated();

        if (array_key_exists('is_primary', $data) && $data['is_primary'] === true) {
            DB::transaction(function () use ($productImage) {
                $product = $productImage->product;

                $product->images()->update(['is_primary' => false]);

                $productImage->forceFill(['is_primary' => true])->save();
            });
        }

        return back()->with('success', 'Image updated successfully.');
    }

    public function destroy(ProductImage $productImage): RedirectResponse
    {
        $this->authorize('delete', $productImage);

        DB::transaction(function () use ($productImage) {
            $product = $productImage->product;
            $wasPrimary = (bool) $productImage->is_primary;

            if ($wasPrimary) {
                $productImage->forceFill(['is_primary' => false])->save();
            }

            $productImage->delete();

            if ($wasPrimary) {
                $replacement = $product->images()->orderByDesc('id')->first();

                if ($replacement) {
                    $replacement->forceFill(['is_primary' => true])->save();
                }
            }
        });

        return back()->with('success', 'Image removed (soft deleted).');
    }

    public function restore(
        RestoreProductImageRequest $request,
        ProductImage $productImage
    ): RedirectResponse {
        DB::transaction(function () use ($productImage) {
            $product = $productImage->product;

            $productImage->restore();

            $hasPrimary = $product->images()->where('is_primary', true)->exists();

            if (! $hasPrimary) {
                $productImage->forceFill(['is_primary' => true])->save();
            }
        });

        return back()->with('success', 'Image restored successfully.');
    }

    public function forceDestroy(
        ForceDeleteProductImageRequest $request,
        ProductImage $productImage
    ): RedirectResponse {
        DB::transaction(function () use ($productImage) {
            $product = $productImage->product;
            $wasPrimary = (bool) $productImage->is_primary;

            if ($wasPrimary) {
                $productImage->forceFill(['is_primary' => false])->save();
            }

            $productImage->forceDelete();

            if ($wasPrimary) {
                $replacement = $product->images()->orderByDesc('id')->first();

                if ($replacement) {
                    $replacement->forceFill(['is_primary' => true])->save();
                }
            }
        });

        return back()->with('success', 'Image deleted permanently.');
    }
}
