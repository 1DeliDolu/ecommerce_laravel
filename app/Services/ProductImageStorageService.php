<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductImageStorageService
{
    public function storeForProduct(UploadedFile $file, int $productId): string
    {
        $directory = "products/{$productId}";

        /** @var \App\Services\ProductImageProcessor $processor */
        $processor = app(ProductImageProcessor::class);

        $result = $processor->toWebp(
            file: $file,
            maxWidth: 1600,
            maxHeight: 1600,
            quality: 82,
            stripMetadata: true
        );

        $path = "{$directory}/{$result['filename']}";

        Storage::disk('public')->put($path, $result['bytes'], [
            'visibility' => 'public',
        ]);

        // Returns a relative path like: products/123/uuid.webp
        return $path;
    }

    public function delete(string $path): void
    {
        Storage::disk('public')->delete($path);
    }

    public function url(string $path): string
    {
        return Storage::disk('public')->url($path);
    }
}
