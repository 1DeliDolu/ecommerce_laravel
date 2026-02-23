<?php

namespace Tests\Feature\Admin;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductImageControllerTest extends TestCase
{
    use RefreshDatabase;

    private function adminUser(): User
    {
        $user = User::factory()->create();
        putenv('ADMIN_EMAILS='.$user->email);
        $_ENV['ADMIN_EMAILS'] = $user->email;
        $_SERVER['ADMIN_EMAILS'] = $user->email;

        return $user;
    }

    // -------------------------------------------------------------------------
    // store
    // -------------------------------------------------------------------------

    public function test_admin_can_upload_images_to_a_product(): void
    {
        Storage::fake('public');

        $admin = $this->adminUser();
        $product = Product::factory()->create();

        $this->actingAs($admin)
            ->post(route('admin.products.images.store', $product), [
                'images' => [
                    UploadedFile::fake()->image('photo.jpg'),
                ],
            ])
            ->assertRedirect();

        $this->assertDatabaseCount('product_images', 1);

        $image = ProductImage::first();
        $this->assertTrue($image->is_primary, 'First uploaded image should be primary');
        Storage::disk('public')->assertExists($image->path);
    }

    public function test_first_uploaded_image_is_not_primary_when_one_already_exists(): void
    {
        Storage::fake('public');

        $admin = $this->adminUser();
        $product = Product::factory()->create();
        ProductImage::factory()->primary()->for($product)->create();

        $this->actingAs($admin)
            ->post(route('admin.products.images.store', $product), [
                'images' => [
                    UploadedFile::fake()->image('second.jpg'),
                ],
            ]);

        $this->assertDatabaseCount('product_images', 2);
        $this->assertSame(1, ProductImage::where('is_primary', true)->count(), 'Only one image should be primary');
    }

    public function test_guest_cannot_upload_images(): void
    {
        $product = Product::factory()->create();

        $this->post(route('admin.products.images.store', $product))
            ->assertRedirect(route('login'));
    }

    public function test_non_admin_cannot_upload_images(): void
    {
        $product = Product::factory()->create();

        $this->actingAs(User::factory()->create())
            ->post(route('admin.products.images.store', $product))
            ->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // update (set primary)
    // -------------------------------------------------------------------------

    public function test_admin_can_set_an_image_as_primary(): void
    {
        $admin = $this->adminUser();
        $product = Product::factory()->create();
        $primary = ProductImage::factory()->primary()->for($product)->create();
        $other = ProductImage::factory()->for($product)->create();

        $this->actingAs($admin)
            ->patch(route('admin.product-images.update', $other), ['is_primary' => true])
            ->assertRedirect();

        $this->assertTrue($other->fresh()->is_primary);
        $this->assertFalse($primary->fresh()->is_primary);
    }

    public function test_non_admin_cannot_update_image(): void
    {
        $image = ProductImage::factory()->for(Product::factory())->create();

        $this->actingAs(User::factory()->create())
            ->patch(route('admin.product-images.update', $image), ['is_primary' => true])
            ->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // destroy (soft delete)
    // -------------------------------------------------------------------------

    public function test_admin_can_soft_delete_an_image(): void
    {
        Storage::fake('public');

        $admin = $this->adminUser();
        $image = ProductImage::factory()->for(Product::factory())->create([
            'path' => 'products/test.jpg',
        ]);
        Storage::disk('public')->put('products/test.jpg', 'fake content');

        $this->actingAs($admin)
            ->delete(route('admin.product-images.destroy', $image))
            ->assertRedirect();

        $this->assertSoftDeleted('product_images', ['id' => $image->id]);
        // Physical file should still exist after soft delete.
        Storage::disk('public')->assertExists('products/test.jpg');
    }

    public function test_non_admin_cannot_soft_delete_image(): void
    {
        $image = ProductImage::factory()->for(Product::factory())->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.product-images.destroy', $image))
            ->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // forceDestroy (permanent delete + file removal via observer)
    // -------------------------------------------------------------------------

    public function test_admin_can_force_delete_an_image_and_removes_file(): void
    {
        Storage::fake('public');

        $admin = $this->adminUser();
        $image = ProductImage::factory()->for(Product::factory())->create([
            'path' => 'products/permanent.jpg',
        ]);
        Storage::disk('public')->put('products/permanent.jpg', 'fake content');

        $this->actingAs($admin)
            ->delete(route('admin.product-images.force-destroy', $image))
            ->assertRedirect();

        $this->assertDatabaseMissing('product_images', ['id' => $image->id]);
        Storage::disk('public')->assertMissing('products/permanent.jpg');
    }

    public function test_non_admin_cannot_force_delete_image(): void
    {
        $image = ProductImage::factory()->for(Product::factory())->create();

        $this->actingAs(User::factory()->create())
            ->delete(route('admin.product-images.force-destroy', $image))
            ->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // restore
    // -------------------------------------------------------------------------

    public function test_admin_can_restore_a_soft_deleted_image(): void
    {
        $admin = $this->adminUser();
        $image = ProductImage::factory()->for(Product::factory())->create();
        $image->delete();

        $this->assertSoftDeleted('product_images', ['id' => $image->id]);

        $this->actingAs($admin)
            ->patch(route('admin.product-images.restore', $image->id))
            ->assertRedirect();

        $this->assertNotSoftDeleted('product_images', ['id' => $image->id]);
    }

    public function test_non_admin_cannot_restore_image(): void
    {
        $image = ProductImage::factory()->for(Product::factory())->create();
        $image->delete();

        $this->actingAs(User::factory()->create())
            ->patch(route('admin.product-images.restore', $image->id))
            ->assertForbidden();
    }
}
