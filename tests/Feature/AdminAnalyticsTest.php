<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_from_admin_analytics_routes(): void
    {
        $this->get(route('admin.analytics.bootstrap'))
            ->assertRedirect(route('login'));

        $this->get(route('admin.analytics.category-products', [
            'category_id' => 1,
        ]))->assertRedirect(route('login'));

        $this->get(route('admin.analytics.timeseries', [
            'scope' => 'overall',
            'metric' => 'revenue',
            'granularity' => 'day',
            'range' => '90d',
        ]))->assertRedirect(route('login'));
    }

    public function test_non_admin_users_cannot_access_admin_analytics_routes(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $this->get(route('admin.analytics.bootstrap'))->assertForbidden();
    }

    public function test_admin_user_can_load_bootstrap_data(): void
    {
        $admin = User::factory()->create();
        $this->setAdminEmails($admin->email);
        $this->actingAs($admin);

        Category::factory()->create(['name' => 'Shoes']);
        Category::factory()->create(['name' => 'T-Shirts']);

        $this->get(route('admin.analytics.bootstrap'))
            ->assertOk()
            ->assertJsonPath('defaults.scope', 'overall')
            ->assertJsonPath('defaults.metric', 'revenue')
            ->assertJsonPath('defaults.granularity', 'day')
            ->assertJsonPath('defaults.range', '90d')
            ->assertJsonCount(2, 'categories');
    }

    public function test_admin_user_can_load_products_for_a_category(): void
    {
        $admin = User::factory()->create();
        $this->setAdminEmails($admin->email);
        $this->actingAs($admin);

        $categoryA = Category::factory()->create();
        $categoryB = Category::factory()->create();

        $productA = Product::factory()->create(['name' => 'Alpha']);
        $productB = Product::factory()->create(['name' => 'Beta']);
        $productC = Product::factory()->create(['name' => 'Gamma']);

        $productA->categories()->sync([$categoryA->id]);
        $productB->categories()->sync([$categoryA->id]);
        $productC->categories()->sync([$categoryB->id]);

        $response = $this->get(route('admin.analytics.category-products', [
            'category_id' => $categoryA->id,
        ]));

        $response->assertOk()->assertJsonCount(2, 'products');

        $names = collect($response->json('products'))->pluck('name')->all();
        $this->assertSame(['Alpha', 'Beta'], $names);
    }

    public function test_admin_user_can_load_all_products_when_category_is_not_selected(): void
    {
        $admin = User::factory()->create();
        $this->setAdminEmails($admin->email);
        $this->actingAs($admin);

        Product::factory()->create(['name' => 'Alpha']);
        Product::factory()->create(['name' => 'Beta']);
        Product::factory()->create(['name' => 'Gamma']);

        $response = $this->get(route('admin.analytics.category-products'));

        $response->assertOk()->assertJsonCount(3, 'products');
    }

    public function test_timeseries_uses_only_paid_and_shipped_statuses_and_supports_scopes(): void
    {
        $admin = User::factory()->create();
        $this->setAdminEmails($admin->email);
        $this->actingAs($admin);

        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'primary_category_id' => $category->id,
        ]);
        $product->categories()->sync([$category->id]);

        $paidOrder = Order::factory()->paid()->create([
            'total' => 20,
            'created_at' => now()->subDays(2),
        ]);
        OrderItem::factory()->for($paidOrder)->for($product)->create([
            'quantity' => 2,
            'line_total' => 20,
        ]);

        $shippedOrder = Order::factory()->shipped()->create([
            'total' => 15,
            'created_at' => now()->subDay(),
        ]);
        OrderItem::factory()->for($shippedOrder)->for($product)->create([
            'quantity' => 1,
            'line_total' => 15,
        ]);

        $pendingOrder = Order::factory()->pending()->create([
            'total' => 999,
            'created_at' => now()->subDay(),
        ]);
        OrderItem::factory()->for($pendingOrder)->for($product)->create([
            'quantity' => 9,
            'line_total' => 999,
        ]);

        $overallResponse = $this->get(route('admin.analytics.timeseries', [
            'scope' => 'overall',
            'metric' => 'revenue',
            'granularity' => 'month',
            'range' => '30d',
        ]));

        $overallResponse
            ->assertOk()
            ->assertJsonPath('statuses_included.0', Order::STATUS_PAID)
            ->assertJsonPath('statuses_included.1', Order::STATUS_SHIPPED)
            ->assertJsonPath('series.0.value', 3500);

        $categoryResponse = $this->get(route('admin.analytics.timeseries', [
            'scope' => 'category',
            'scope_id' => $category->id,
            'metric' => 'units',
            'granularity' => 'month',
            'range' => '30d',
        ]));

        $categoryResponse
            ->assertOk()
            ->assertJsonPath('series.0.value', 3);

        $productResponse = $this->get(route('admin.analytics.timeseries', [
            'scope' => 'product',
            'scope_id' => $product->id,
            'metric' => 'orders',
            'granularity' => 'month',
            'range' => '30d',
        ]));

        $productResponse
            ->assertOk()
            ->assertJsonPath('series.0.value', 2);
    }

    private function setAdminEmails(string $emails): void
    {
        putenv('ADMIN_EMAILS='.$emails);
        $_ENV['ADMIN_EMAILS'] = $emails;
        $_SERVER['ADMIN_EMAILS'] = $emails;
    }
}
