<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ProductImageStorageService
{
    public function storeForProduct(UploadedFile $file, int $productId): string
    {
        $directory = "products/{$productId}";

        // Returns a relative path like: products/123/abc123.webp
        return $file->storePublicly($directory, ['disk' => 'public']);
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