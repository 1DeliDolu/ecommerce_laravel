<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreProductImageRequest;
use App\Http\Requests\Admin\UpdateProductImageRequest;
use App\Models\Product;
use App\Models\ProductImage;
use App\Services\ProductImageStorageService;
use Illuminate\Database\Eloquent\SoftDeletes;
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
                        'is_primary' => (!$hasPrimary && $index === 0),
                    ]);
                }
            });

            return back()->with('success', 'Images uploaded successfully.');
        } catch (\Throwable $e) {
            foreach ($storedPaths as $path) {
                $storage->delete($path);
            }

            throw $e;
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

    public function destroy(
        ProductImage $productImage,
        ProductImageStorageService $storage
    ): RedirectResponse {
        $this->authorize('delete', $productImage);

        $path = $productImage->path;
        $usesSoftDeletes = in_array(SoftDeletes::class, class_uses_recursive($productImage), true);

        DB::transaction(function () use ($productImage) {
            $productImage->delete();
        });

        // If the model does NOT use soft deletes, remove the file immediately.
        // If it DOES use soft deletes, we keep the file for possible restore/audit.
        if (!$usesSoftDeletes) {
            $storage->delete($path);
        }

        return back()->with('success', 'Image removed successfully.');
    }
}