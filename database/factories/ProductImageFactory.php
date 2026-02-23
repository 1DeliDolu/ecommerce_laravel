<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductImage>
 */
class ProductImageFactory extends Factory
{
    protected $model = ProductImage::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'disk' => 'public',
            'path' => 'products/'.$this->faker->uuid.'.jpg',
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
}
