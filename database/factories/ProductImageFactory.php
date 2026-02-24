<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;

/**
 * @extends Factory<ProductImage>
 */
class ProductImageFactory extends Factory
{
    protected $model = ProductImage::class;

    public function definition(): array
    {
        $uuid = $this->faker->uuid;
        $filename = "products/{$uuid}.jpg";

        // Create a simple placeholder JPG file for seeding
        $this->createPlaceholderImage($filename);

        return [
            'product_id' => Product::factory(),
            'disk' => 'public',
            'path' => $filename,
            'alt' => $this->faker->optional(0.7)->sentence(4),

            'sort_order' => 0,
            'is_primary' => false,
        ];
    }

    public function primary(int $sortOrder = 0): static
    {
        return $this->state(fn () => [
            'is_primary' => true,
            'sort_order' => $sortOrder,
        ]);
    }

    /**
     * Create a simple placeholder JPG image file.
     * In production, implement proper image generation.
     */
    private function createPlaceholderImage(string $path): void
    {
        // Create directory if not exists
        $disk = Storage::disk('public');
        $directory = dirname($path);

        if ($directory !== '.' && ! $disk->exists($directory)) {
            $disk->makeDirectory($directory, 0755, true);
        }

        // Create a minimal valid JPG file (1x1 pixel placeholder)
        // This is a valid minimal JPEG binary data
        $jpegData = base64_decode(
            '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a'
            .'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIy'
            .'MjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIA'
            .'AhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8VAFQEB'
            .'AQAAAAAAAAAAAAAAAAAAAP/EABYRAQEBAAAAAAAAAAAAAAAEAAERAv/aAAwDAQACEQMRAD8A/'
        );

        if ($jpegData && strlen($jpegData) > 0) {
            $disk->put($path, $jpegData);
        } else {
            // Fallback: create empty file if base64 decode fails
            $disk->put($path, '');
        }
    }
}
