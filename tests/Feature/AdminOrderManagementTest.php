<?php

namespace Tests\Feature;

use App\Mail\OrderStatusUpdated;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminOrderManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_orders_list_with_filters(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $paidOrder = Order::factory()->paid()->create([
            'public_id' => 'ORD-PAID-TEST-1',
            'email' => 'paid@example.test',
        ]);

        OrderItem::factory()->count(2)->for($paidOrder)->create();

        $pendingOrder = Order::factory()->pending()->create([
            'public_id' => 'ORD-PENDING-TEST-1',
            'email' => 'pending@example.test',
        ]);

        OrderItem::factory()->for($pendingOrder)->create();

        $this->actingAs($adminUser)
            ->get(route('admin.orders.index', [
                'status' => 'paid',
                'q' => 'paid@example.test',
            ]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/index')
                ->where('filters.status', 'paid')
                ->where('filters.q', 'paid@example.test')
                ->has('orders.data', 1)
                ->where('orders.data.0.public_id', 'ORD-PAID-TEST-1')
                ->where('orders.data.0.items_count', 2)
            );
    }

    public function test_admin_can_view_order_detail(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $order = Order::factory()->pending()->create([
            'public_id' => 'ORD-SHOW-TEST-1',
        ]);

        OrderItem::factory()->for($order)->create([
            'product_name' => 'Sample Product',
            'quantity' => 3,
        ]);

        $this->actingAs($adminUser)
            ->get(route('admin.orders.show', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/orders/show')
                ->where('order.public_id', 'ORD-SHOW-TEST-1')
                ->where('order.items.0.product_name', 'Sample Product')
                ->where('order.items.0.quantity', 3)
                ->where('allowedStatuses.0', 'pending')
                ->where('allowedStatuses.1', 'paid')
                ->where('allowedStatuses.2', 'cancelled')
            );
    }

    public function test_admin_can_update_order_status_with_allowed_transition(): void
    {
        Mail::fake();

        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $order = Order::factory()->pending()->create([
            'public_id' => 'ORD-STATUS-TEST-1',
        ]);

        $this->actingAs($adminUser)
            ->patch(route('admin.orders.updateStatus', $order), [
                'status' => 'paid',
            ])
            ->assertRedirect(route('admin.orders.show', $order));

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'paid',
        ]);

        Mail::assertNotSent(OrderStatusUpdated::class);
    }

    public function test_status_update_to_shipped_sends_status_updated_email(): void
    {
        Mail::fake();

        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $order = Order::factory()->paid()->create([
            'public_id' => 'ORD-MAIL-TEST-1',
            'email' => 'customer@example.test',
        ]);

        $this->actingAs($adminUser)
            ->patch(route('admin.orders.updateStatus', $order), [
                'status' => 'shipped',
            ])
            ->assertRedirect(route('admin.orders.show', $order));

        Mail::assertSent(OrderStatusUpdated::class, function (OrderStatusUpdated $mail) use ($order): bool {
            return $mail->order->is($order)
                && $mail->previousStatus === 'paid'
                && $mail->currentStatus === 'shipped'
                && $mail->hasTo('customer@example.test');
        });
    }

    public function test_admin_cannot_update_order_status_with_invalid_transition(): void
    {
        $adminUser = User::factory()->create();
        $this->setAdminEmails($adminUser->email);

        $order = Order::factory()->shipped()->create([
            'public_id' => 'ORD-STATUS-TEST-2',
        ]);

        $this->actingAs($adminUser)
            ->from(route('admin.orders.show', $order))
            ->patch(route('admin.orders.updateStatus', $order), [
                'status' => 'pending',
            ])
            ->assertSessionHasErrors('status');

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'shipped',
        ]);
    }

    private function setAdminEmails(string $emails): void
    {
        putenv('ADMIN_EMAILS='.$emails);
        $_ENV['ADMIN_EMAILS'] = $emails;
        $_SERVER['ADMIN_EMAILS'] = $emails;
    }
}
