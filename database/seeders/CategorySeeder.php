<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        // Deterministic "core" categories for ecommerce
        $core = [
            'Electronics' => ['Phones', 'Laptops', 'Audio'],
            'Fashion' => ['Men', 'Women', 'Kids'],
            'Home & Living' => ['Kitchen', 'Bedroom', 'Bathroom'],
            'Sports & Outdoors' => ['Fitness', 'Cycling', 'Camping'],
            'Beauty' => ['Skincare', 'Makeup', 'Haircare'],
        ];

        $sort = 0;

        foreach ($core as $rootName => $children) {
            $root = Category::query()->updateOrCreate(
                ['slug' => Str::slug($rootName)],
                [
                    'parent_id' => null,
                    'name' => $rootName,
                    'description' => "Browse {$rootName} products.",
                    'is_active' => true,
                    'sort_order' => $sort++,
                ]
            );

            $childSort = 0;

            foreach ($children as $childName) {
                Category::query()->updateOrCreate(
                    ['slug' => Str::slug($rootName.' '.$childName)],
                    [
                        'parent_id' => $root->id,
                        'name' => $childName,
                        'description' => "Browse {$childName} in {$rootName}.",
                        'is_active' => true,
                        'sort_order' => $childSort++,
                    ]
                );
            }
        }

        // Some extra random categories for pagination/testing
        Category::factory()->count(10)->create();
    }
}
