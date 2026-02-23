<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EcommerceRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_admin_routes_to_login(): void
    {
        $this->get(route('admin.categories.index'))
            ->assertRedirect(route('login'));
    }

    public function test_guests_can_access_public_shop_routes(): void
    {
        $this->get(route('shop.products.index'))
            ->assertOk();
    }

    public function test_authenticated_non_admin_user_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $this->get(route('admin.categories.index'))
            ->assertForbidden();
    }

    public function test_authenticated_admin_user_can_access_admin_routes(): void
    {
        $adminUser = User::factory()->create();
        putenv('ADMIN_EMAILS='.$adminUser->email);
        $_ENV['ADMIN_EMAILS'] = $adminUser->email;
        $_SERVER['ADMIN_EMAILS'] = $adminUser->email;

        $this->actingAs($adminUser);

        $this->get(route('admin.categories.index'))
            ->assertOk();
    }
}
