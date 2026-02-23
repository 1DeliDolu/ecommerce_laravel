<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EcommerceRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_account_and_admin_routes_to_login(): void
    {
        $this->get(route('account.orders.index'))
            ->assertRedirect(route('login'));

        $this->get(route('admin.overview.index'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_non_admin_user_can_access_account_but_not_admin_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $this->get(route('account.orders.index'))
            ->assertOk();

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
