<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
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

        $this->get(route('admin.product-images.trashed'))
            ->assertRedirect(route('login'));
    }

    public function test_authenticated_non_admin_user_can_access_account_but_not_admin_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user);

        $this->get(route('account.orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('account/orders/index')
            );

        $this->get(route('admin.categories.index'))
            ->assertForbidden();

        $this->get(route('admin.product-images.trashed'))
            ->assertForbidden();
    }

    public function test_authenticated_admin_user_can_access_admin_routes(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $this->actingAs($adminUser);

        $this->get(route('admin.categories.index'))
            ->assertOk();

        $this->get(route('admin.products.index'))
            ->assertOk();

        $this->get(route('admin.product-images.trashed'))
            ->assertOk();
    }

    public function test_dashboard_inertia_props_include_false_admin_access_for_non_admin_user(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.can.access_admin', false)
            );
    }

    public function test_dashboard_inertia_props_include_true_admin_access_for_admin_user(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $this->actingAs($adminUser)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('auth.can.access_admin', true)
            );
    }

    public function test_account_orders_page_only_shows_authenticated_users_orders(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();

        $usersOrder = Order::factory()->paid()->create([
            'user_id' => $user->id,
            'public_id' => 'ORD-ACCOUNT-TEST-1',
        ]);

        OrderItem::factory()->count(2)->for($usersOrder)->create();

        $otherOrder = Order::factory()->pending()->create([
            'user_id' => $otherUser->id,
            'public_id' => 'ORD-ACCOUNT-TEST-2',
        ]);

        OrderItem::factory()->for($otherOrder)->create();

        $this->actingAs($user)
            ->get(route('account.orders.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('account/orders/index')
                ->has('orders.data', 1)
                ->where('orders.data.0.public_id', 'ORD-ACCOUNT-TEST-1')
                ->where('orders.data.0.items_count', 2)
            );
    }

    private function setAdminEmails(string $emails): void
    {
        putenv('ADMIN_EMAILS='.$emails);
        $_ENV['ADMIN_EMAILS'] = $emails;
        $_SERVER['ADMIN_EMAILS'] = $emails;
    }
}
