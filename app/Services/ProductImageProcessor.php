<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;

class ProductImageProcessor
{
    /**
     * Process an uploaded image into WebP with a maximum bounding box.
     *
     * Returns:
     *  - filename: recommended filename (without directory)
     *  - bytes: the encoded image data (binary string)
     *
     * @return array{filename: string, bytes: string}
     */
    public function toWebp(
        UploadedFile $file,
        int $maxWidth = 1600,
        int $maxHeight = 1600,
        int $quality = 82,
        bool $stripMetadata = true
    ): array {
        $this->assertWebpSupport();

        $image = Image::read($file->getRealPath())
            // Keep aspect ratio; never upscale above original.
            ->scaleDown(width: $maxWidth, height: $maxHeight);

        // Encode to WebP. Signature: toWebp(int $quality = 75, null|bool $strip = null)
        $encoded = $image->toWebp($quality, $stripMetadata);

        return [
            'filename' => Str::uuid()->toString().'.webp',
            'bytes' => (string) $encoded,
        ];
    }

    /**
     * Fail fast if the runtime cannot encode WebP (common when GD was built without WebP).
     */
    private function assertWebpSupport(): void
    {
        $driver = (string) config('image.driver', '');

        // GD driver: require imagewebp() support
        if (str_contains($driver, 'Drivers\\Gd\\') && ! function_exists('imagewebp')) {
            throw new \RuntimeException(
                'WebP encoding is not supported by your GD installation. Enable GD with WebP support or switch to Imagick driver.'
            );
        }
    }
}
