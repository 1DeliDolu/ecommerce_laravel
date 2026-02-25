<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ShopBrowsingTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_can_view_shop_and_only_active_products_are_listed(): void
    {
        $activeProduct = Product::factory()->create([
            'name' => 'Trail Runner',
            'slug' => 'trail-runner',
            'price' => 89.90,
            'is_active' => true,
        ]);

        Product::factory()->create([
            'name' => 'Hidden Product',
            'slug' => 'hidden-product',
            'is_active' => false,
        ]);

        $this->get(route('shop.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('shop/index')
                ->has('products.data', 1)
                ->where('products.data.0.slug', $activeProduct->slug)
                ->where('products.total', 1)
            );
    }

    public function test_shop_index_is_paginated_with_nine_products_per_page(): void
    {
        for ($index = 1; $index <= 12; $index++) {
            Product::factory()->create([
                'name' => sprintf('Product %02d', $index),
                'slug' => sprintf('product-%02d', $index),
                'is_active' => true,
            ]);
        }

        $this->get(route('shop.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('shop/index')
                ->has('products.data', 9)
                ->where('products.current_page', 1)
                ->where('products.last_page', 2)
                ->where('products.total', 12)
            );
    }

    public function test_filters_and_search_are_applied_with_pagination(): void
    {
        $category = Category::factory()->create([
            'name' => 'Running',
            'slug' => 'running',
            'is_active' => true,
        ]);

        for ($index = 1; $index <= 10; $index++) {
            $product = Product::factory()->create([
                'name' => sprintf('Runner %02d', $index),
                'slug' => sprintf('runner-%02d', $index),
                'brand' => 'Nike',
                'model_name' => 'Pegasus 41',
                'color' => 'Black',
                'product_type' => 'clothing',
                'available_clothing_sizes' => ['S', 'M', 'L'],
                'price' => 55.00,
                'is_active' => true,
                'primary_category_id' => $category->id,
            ]);

            $product->categories()->sync([$category->id]);
        }

        $walker = Product::factory()->create([
            'name' => 'Walker 01',
            'slug' => 'walker-01',
            'brand' => 'Nike',
            'model_name' => 'Pegasus 41',
            'color' => 'Black',
            'product_type' => 'clothing',
            'available_clothing_sizes' => ['M'],
            'price' => 55.00,
            'is_active' => true,
            'primary_category_id' => $category->id,
        ]);
        $walker->categories()->sync([$category->id]);

        $highPriceRunner = Product::factory()->create([
            'name' => 'Runner High Price',
            'slug' => 'runner-high-price',
            'brand' => 'Nike',
            'model_name' => 'Pegasus 41',
            'color' => 'Black',
            'product_type' => 'clothing',
            'available_clothing_sizes' => ['M'],
            'price' => 120.00,
            'is_active' => true,
            'primary_category_id' => $category->id,
        ]);
        $highPriceRunner->categories()->sync([$category->id]);

        $otherBrandRunner = Product::factory()->create([
            'name' => 'Runner Other Brand',
            'slug' => 'runner-other-brand',
            'brand' => 'Adidas',
            'model_name' => 'Pegasus 41',
            'color' => 'Black',
            'product_type' => 'clothing',
            'available_clothing_sizes' => ['M'],
            'price' => 55.00,
            'is_active' => true,
            'primary_category_id' => $category->id,
        ]);
        $otherBrandRunner->categories()->sync([$category->id]);

        $otherColorRunner = Product::factory()->create([
            'name' => 'Runner Other Color',
            'slug' => 'runner-other-color',
            'brand' => 'Nike',
            'model_name' => 'Pegasus 41',
            'color' => 'Blue',
            'product_type' => 'clothing',
            'available_clothing_sizes' => ['M'],
            'price' => 55.00,
            'is_active' => true,
            'primary_category_id' => $category->id,
        ]);
        $otherColorRunner->categories()->sync([$category->id]);

        $query = [
            'category' => $category->slug,
            'search' => 'runner',
            'brand' => 'Nike',
            'model' => 'Pegasus 41',
            'color' => 'Black',
            'product_type' => 'clothing',
            'clothing_size' => 'M',
            'min_price' => 50,
            'max_price' => 60,
        ];

        $this->get(route('shop.index', $query))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('shop/index')
                ->has('products.data', 9)
                ->where('products.total', 10)
                ->where('products.current_page', 1)
                ->where('filters.category', 'running')
                ->where('filters.search', 'runner')
                ->where('filters.brand', 'Nike')
                ->where('filters.model', 'Pegasus 41')
                ->where('filters.color', 'Black')
                ->where('filters.product_type', 'clothing')
                ->where('filters.clothing_size', 'M')
                ->where('filters.shoe_size', '')
                ->where('filters.min_price', 50)
                ->where('filters.max_price', 60)
                ->has('filter_options.brands')
                ->has('filter_options.models')
                ->has('filter_options.colors')
                ->has('filter_options.product_types')
                ->has('filter_options.clothing_sizes')
                ->has('filter_options.shoe_sizes')
            );

        $this->get(route('shop.index', [...$query, 'page' => 2]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('shop/index')
                ->has('products.data', 1)
                ->where('products.current_page', 2)
                ->where('products.data.0.slug', 'runner-10')
            );
    }

    public function test_guest_can_view_active_product_detail_with_images(): void
    {
        $product = Product::factory()->create([
            'name' => 'Trail Runner',
            'slug' => 'trail-runner',
            'brand' => 'Nike',
            'model_name' => 'Vomero 17',
            'product_type' => 'shoes',
            'color' => 'Black',
            'material' => 'Mesh',
            'available_shoe_sizes' => ['42', '43'],
            'is_active' => true,
        ]);

        ProductImage::factory()->for($product)->primary()->create([
            'path' => 'products/trail-runner-primary.jpg',
        ]);
        ProductImage::factory()->for($product)->create([
            'path' => 'products/trail-runner-side.jpg',
            'sort_order' => 1,
        ]);

        $this->get(route('shop.show', $product))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('shop/view')
                ->where('product.slug', $product->slug)
                ->where('product.brand', 'Nike')
                ->where('product.model_name', 'Vomero 17')
                ->where('product.product_type', 'shoes')
                ->where('product.color', 'Black')
                ->where('product.material', 'Mesh')
                ->where('product.available_shoe_sizes.0', '42')
                ->has('product.images', 2)
                ->where('product.images.0.is_primary', true)
            );
    }

    public function test_guest_cannot_view_inactive_product_detail(): void
    {
        $inactiveProduct = Product::factory()->inactive()->create([
            'slug' => 'hidden-product',
        ]);

        $this->get(route('shop.show', $inactiveProduct))
            ->assertNotFound();
    }
}
