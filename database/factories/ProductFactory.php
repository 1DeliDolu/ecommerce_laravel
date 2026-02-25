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

        $priceCents = $this->faker->numberBetween(500, 250000); // 5.00 - 2500.00
        $price = $priceCents / 100;

        $hasCompare = $this->faker->boolean(25);
        $compareAt = $hasCompare
            ? (($priceCents + $this->faker->numberBetween(100, 50000)) / 100)
            : null;

        return [
            'name' => Str::title($baseName),
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
<<<<<<< Updated upstream
=======
            'primary_category_id' => Category::query()
                ->whereNotNull('parent_id')
                ->inRandomOrder()
                ->value('id'),
>>>>>>> Stashed changes
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
