<?php

namespace Tests\Feature\Admin;

use App\Mail\OrderStatusUpdated;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    private function adminUser(): User
    {
        $user = User::factory()->create();
        putenv('ADMIN_EMAILS='.$user->email);
        $_ENV['ADMIN_EMAILS'] = $user->email;
        $_SERVER['ADMIN_EMAILS'] = $user->email;

        return $user;
    }

    // -------------------------------------------------------------------------
    // index
    // -------------------------------------------------------------------------

    public function test_admin_can_view_orders_list(): void
    {
        $admin = $this->adminUser();
        Order::factory()->count(3)->create();

        $this->actingAs($admin)
            ->get(route('admin.orders.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/orders/index')
                ->has('orders.data', 3)
            );
    }

    public function test_guest_cannot_view_orders_list(): void
    {
        $this->get(route('admin.orders.index'))
            ->assertRedirect(route('login'));
    }

    public function test_non_admin_cannot_view_orders_list(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('admin.orders.index'))
            ->assertForbidden();
    }

    public function test_orders_list_can_be_filtered_by_status(): void
    {
        $admin = $this->adminUser();
        Order::factory()->paid()->count(2)->create();
        Order::factory()->pending()->count(3)->create();

        $this->actingAs($admin)
            ->get(route('admin.orders.index', ['status' => 'paid']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders.data', 2)
            );
    }

    public function test_orders_list_can_be_searched_by_email(): void
    {
        $admin = $this->adminUser();
        Order::factory()->create(['email' => 'find-me@example.com']);
        Order::factory()->create(['email' => 'other@example.com']);

        $this->actingAs($admin)
            ->get(route('admin.orders.index', ['q' => 'find-me']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('orders.data', 1)
            );
    }

    // -------------------------------------------------------------------------
    // show
    // -------------------------------------------------------------------------

    public function test_admin_can_view_order_detail(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->paid()->create();

        $this->actingAs($admin)
            ->get(route('admin.orders.show', $order))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('admin/orders/show')
                ->where('order.id', $order->id)
                ->where('order.status', 'paid')
                ->has('allowed_transitions')
            );
    }

    public function test_guest_cannot_view_order_detail(): void
    {
        $order = Order::factory()->create();

        $this->get(route('admin.orders.show', $order))
            ->assertRedirect(route('login'));
    }

    public function test_non_admin_cannot_view_order_detail(): void
    {
        $order = Order::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('admin.orders.show', $order))
            ->assertForbidden();
    }

    // -------------------------------------------------------------------------
    // updateStatus
    // -------------------------------------------------------------------------

    public function test_admin_can_update_order_status_to_valid_transition(): void
    {
        Mail::fake();
        $admin = $this->adminUser();
        $order = Order::factory()->pending()->create(['email' => 'customer@example.com']);

        $this->actingAs($admin)
            ->patch(route('admin.orders.update-status', $order), ['status' => 'paid'])
            ->assertRedirect(route('admin.orders.show', $order));

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'paid']);
    }

    public function test_status_update_sends_email_to_customer(): void
    {
        Mail::fake();
        $admin = $this->adminUser();
        $order = Order::factory()->pending()->create(['email' => 'customer@example.com']);

        $this->actingAs($admin)
            ->patch(route('admin.orders.update-status', $order), ['status' => 'paid']);

        Mail::assertSent(OrderStatusUpdated::class, function (OrderStatusUpdated $mail) use ($order) {
            return $mail->hasTo($order->email)
                && $mail->order->id === $order->id
                && $mail->previousStatus === 'pending';
        });
    }

    public function test_admin_cannot_update_to_invalid_status_transition(): void
    {
        Mail::fake();
        $admin = $this->adminUser();
        $order = Order::factory()->pending()->create();

        $this->actingAs($admin)
            ->patch(route('admin.orders.update-status', $order), ['status' => 'shipped'])
            ->assertSessionHasErrors('status');

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'pending']);
        Mail::assertNothingSent();
    }

    public function test_shipped_order_has_no_transitions(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->shipped()->create();

        $this->actingAs($admin)
            ->get(route('admin.orders.show', $order))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('allowed_transitions', [])
            );
    }

    public function test_cancelled_order_has_no_transitions(): void
    {
        $admin = $this->adminUser();
        $order = Order::factory()->cancelled()->create();

        $this->actingAs($admin)
            ->patch(route('admin.orders.update-status', $order), ['status' => 'paid'])
            ->assertSessionHasErrors('status');
    }

    public function test_guest_cannot_update_order_status(): void
    {
        $order = Order::factory()->pending()->create();

        $this->patch(route('admin.orders.update-status', $order), ['status' => 'paid'])
            ->assertRedirect(route('login'));
    }

    public function test_non_admin_cannot_update_order_status(): void
    {
        $order = Order::factory()->pending()->create();

        $this->actingAs(User::factory()->create())
            ->patch(route('admin.orders.update-status', $order), ['status' => 'paid'])
            ->assertForbidden();
    }
}
