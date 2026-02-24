<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminProductImageTrashManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_trashed_images_list(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $product = Product::factory()->create([
            'name' => 'Trail Shoe',
            'slug' => 'trail-shoe',
        ]);

        $trashedImage = ProductImage::factory()->for($product)->create([
            'path' => 'products/trail-shoe-main.jpg',
        ]);
        $trashedImage->delete();

        ProductImage::factory()->for($product)->create([
            'path' => 'products/trail-shoe-secondary.jpg',
        ]);

        $this->actingAs($adminUser)
            ->get(route('admin.product-images.trashed', ['q' => 'trail-shoe-main']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/product-images/trashed')
                ->where('filters.q', 'trail-shoe-main')
                ->has('images.data', 1)
                ->where('images.data.0.id', $trashedImage->id)
            );
    }

    public function test_admin_can_restore_trashed_image(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $image = ProductImage::factory()->create();
        $image->delete();

        $this->actingAs($adminUser)
            ->patch(route('admin.product-images.restore', $image))
            ->assertRedirect();

        $this->assertFalse($image->fresh()->trashed());
    }

    public function test_admin_can_force_delete_trashed_image(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $image = ProductImage::factory()->create();
        $image->delete();

        $this->actingAs($adminUser)
            ->delete(route('admin.product-images.forceDelete', $image))
            ->assertRedirect();

        $this->assertDatabaseMissing('product_images', [
            'id' => $image->id,
        ]);
    }

    public function test_non_admin_user_cannot_manage_trashed_images(): void
    {
        $user = User::factory()->create();
        $image = ProductImage::factory()->create();
        $image->delete();

        $this->actingAs($user);

        $this->get(route('admin.product-images.trashed'))
            ->assertForbidden();

        $this->patch(route('admin.product-images.restore', $image))
            ->assertForbidden();

        $this->delete(route('admin.product-images.forceDelete', $image))
            ->assertForbidden();
    }

    private function setAdminEmails(string $emails): void
    {
        putenv('ADMIN_EMAILS='.$emails);
        $_ENV['ADMIN_EMAILS'] = $emails;
        $_SERVER['ADMIN_EMAILS'] = $emails;
    }
}
