<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminProductFileUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_product_with_uploaded_images(): void
    {
        Storage::fake('public');

        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $category = Category::factory()->create();

        $this->actingAs($adminUser)
            ->post(route('admin.products.store'), [
                'name' => 'Trail Runner',
                'slug' => '',
                'description' => 'Test product',
                'brand' => 'Nike',
                'model_name' => 'Pegasus 41',
                'product_type' => 'shoes',
                'color' => 'Black',
                'material' => 'Mesh',
                'available_clothing_sizes' => [],
                'available_shoe_sizes' => ['42', '43'],
                'price' => '99.90',
                'compare_at_price' => '129.90',
                'sku' => 'TRAIL-001',
                'stock' => 10,
                'is_active' => true,
                'category_ids' => [$category->id],
                'primary_category_id' => $category->id,
                'uploaded_images' => [
                    UploadedFile::fake()->image('trail.jpg', 800, 800),
                ],
            ])
            ->assertRedirect();

        $product = Product::query()->firstOrFail();
        $image = ProductImage::query()->where('product_id', $product->id)->first();

        $this->assertSame('Nike', $product->brand);
        $this->assertSame('Pegasus 41', $product->model_name);
        $this->assertSame('shoes', $product->product_type);
        $this->assertSame(['42', '43'], $product->available_shoe_sizes);
        $this->assertNotNull($image);
        $this->assertStringStartsWith('products/', (string) $image->path);
        Storage::disk('public')->assertExists((string) $image->path);
    }

    public function test_admin_can_update_product_with_uploaded_images_using_method_spoofing(): void
    {
        Storage::fake('public');

        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'name' => 'City Sneaker',
            'slug' => 'city-sneaker',
            'primary_category_id' => $category->id,
        ]);
        $product->categories()->sync([$category->id]);

        $oldImage = ProductImage::factory()->for($product)->create([
            'path' => 'products/old-image.jpg',
            'is_primary' => true,
        ]);

        $this->actingAs($adminUser)
            ->post(route('admin.products.update', $product), [
                '_method' => 'PUT',
                'name' => 'City Sneaker Updated',
                'slug' => '',
                'description' => 'Updated',
                'brand' => 'Adidas',
                'model_name' => 'Ultraboost',
                'product_type' => 'shoes',
                'color' => 'White',
                'material' => 'Primeknit',
                'available_clothing_sizes' => [],
                'available_shoe_sizes' => ['43', '44'],
                'price' => '109.90',
                'compare_at_price' => '139.90',
                'sku' => 'CITY-002',
                'stock' => 7,
                'is_active' => true,
                'category_ids' => [$category->id],
                'primary_category_id' => $category->id,
                'uploaded_images' => [
                    UploadedFile::fake()->image('new-city.jpg', 1000, 1000),
                ],
            ])
            ->assertRedirect();

        $newImage = ProductImage::query()
            ->where('product_id', $product->id)
            ->latest('id')
            ->first();

        $this->assertNotNull($newImage);
        $this->assertStringStartsWith('products/', (string) $newImage->path);
        $this->assertTrue((bool) $newImage->is_primary);
        $this->assertNotSame($oldImage->id, $newImage->id);
        $product->refresh();
        $this->assertSame('Adidas', $product->brand);
        $this->assertSame('Ultraboost', $product->model_name);
        $this->assertSame('shoes', $product->product_type);
        $this->assertSame(['43', '44'], $product->available_shoe_sizes);
        $this->assertSoftDeleted('product_images', [
            'id' => $oldImage->id,
        ]);
        Storage::disk('public')->assertExists((string) $newImage->path);
    }

    private function setAdminEmails(string $emails): void
    {
        putenv('ADMIN_EMAILS='.$emails);
        $_ENV['ADMIN_EMAILS'] = $emails;
        $_SERVER['ADMIN_EMAILS'] = $emails;
    }
}
