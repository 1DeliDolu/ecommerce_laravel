<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure we have categories to attach products to.
        if (Category::query()->count() === 0) {
            // If you already have a CategorySeeder, prefer running that instead.
            Category::factory()->count(12)->create();
        }

        $categoryIds = Category::query()->pluck('id')->all();

        Product::factory()
            ->count(60)
            ->create()
            ->each(function (Product $product) use ($categoryIds) {
                // Attach 1-3 random categories
                $product->categories()->sync(
                    collect($categoryIds)->shuffle()->take(rand(1, 3))->values()->all()
                );

                // Create images (1 primary + 1-5 additional)
                $total = rand(2, 6);

                ProductImage::factory()
                    ->for($product)
                    ->primary(0)
                    ->create();

                for ($i = 1; $i < $total; $i++) {
                    ProductImage::factory()
                        ->for($product)
                        ->state([
                            'sort_order' => $i,
                            'is_primary' => false,
                        ])
                        ->create();
                }
            });
    }
}
