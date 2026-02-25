<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $baseName = $this->faker->unique()->words(3, true);
        $slug = Str::slug($baseName);
        $productType = $this->faker->randomElement(Product::productTypes());
        $clothingSizes = Product::clothingSizeOptions();
        $shoeSizes = Product::shoeSizeOptions();

        $priceCents = $this->faker->numberBetween(500, 250000); // 5.00 - 2500.00
        $price = $priceCents / 100;

        $hasCompare = $this->faker->boolean(25);
        $compareAt = $hasCompare
            ? (($priceCents + $this->faker->numberBetween(100, 50000)) / 100)
            : null;

        return [
            'name' => Str::title($baseName),
            'brand' => $this->faker->randomElement(Product::brandOptions()),
            'model_name' => $this->faker->randomElement(Product::modelOptions()),
            'product_type' => $productType,
            'color' => $this->faker->randomElement(Product::colorOptions()),
            'material' => $this->faker->randomElement(['Cotton', 'Leather', 'Polyester', 'Wool Blend', 'Synthetic']),
            'available_clothing_sizes' => $productType === Product::TYPE_CLOTHING
                ? collect($clothingSizes)->shuffle()->take($this->faker->numberBetween(2, 5))->values()->all()
                : [],
            'available_shoe_sizes' => $productType === Product::TYPE_SHOES
                ? collect($shoeSizes)->shuffle()->take($this->faker->numberBetween(3, 6))->values()->all()
                : [],
            'slug' => $slug,
            'description' => $this->faker->optional(0.85)->paragraphs(3, true),

            'price' => $price,
            'compare_at_price' => $compareAt,

            // FIX: optional() can return null; don't chain methods after it.
            'sku' => $this->faker->boolean(70)
                ? $this->faker->unique()->bothify('SKU-#####??')
                : null,

            'stock' => $this->faker->numberBetween(0, 500),
            'is_active' => $this->faker->boolean(90),
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['stock' => 0]);
    }
}
