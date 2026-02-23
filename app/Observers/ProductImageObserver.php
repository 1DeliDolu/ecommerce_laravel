<?php

namespace App\Observers;

use App\Models\ProductImage;
use Illuminate\Support\Facades\Storage;

class ProductImageObserver
{
    /**
     * Delete the physical file only when the record is permanently removed.
     */
    public function forceDeleted(ProductImage $productImage): void
    {
        if (! empty($productImage->path)) {
            Storage::disk('public')->delete($productImage->path);
        }
    }
}
