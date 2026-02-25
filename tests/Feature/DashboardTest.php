<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page(): void
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_non_admin_users_see_the_standard_dashboard_page(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
            );
    }

    public function test_authenticated_admin_users_see_admin_dashboard_with_sales_metrics(): void
    {
        $admin = User::factory()->platinum()->create();
        $this->setAdminEmails($admin->email);
        $this->actingAs($admin);

        $product = Product::factory()->create();

        $paidOrder = Order::factory()->paid()->create();
        OrderItem::factory()->for($paidOrder)->for($product)->create([
            'quantity' => 2,
            'line_total' => 40,
        ]);

        $shippedOrder = Order::factory()->shipped()->create();
        OrderItem::factory()->for($shippedOrder)->for($product)->create([
            'quantity' => 1,
            'line_total' => 15,
        ]);

        $pendingOrder = Order::factory()->pending()->create();
        OrderItem::factory()->for($pendingOrder)->for($product)->create([
            'quantity' => 10,
            'line_total' => 400,
        ]);

        $this->get(route('dashboard', [
            'range' => '90d',
            'granularity' => 'month',
        ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/dashboard/index')
                ->where('metrics.filters.range', '90d')
                ->where('metrics.filters.granularity', 'month')
                ->where('metrics.kpis.orders', 2)
                ->where('metrics.statuses_included.0', 'paid')
                ->where('metrics.statuses_included.1', 'shipped')
                ->where('pricing_preview.discount_rate', 0)
            );
    }

    private function setAdminEmails(string $emails): void
    {
        putenv('ADMIN_EMAILS='.$emails);
        $_ENV['ADMIN_EMAILS'] = $emails;
        $_SERVER['ADMIN_EMAILS'] = $emails;
    }
}
