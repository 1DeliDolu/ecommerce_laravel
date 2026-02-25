<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CartCheckoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_complete_checkout_with_manual_payment_details(): void
    {
        $product = Product::factory()->create([
            'name' => 'Trail Pack',
            'slug' => 'trail-pack',
            'price' => 120.00,
            'stock' => 10,
            'is_active' => true,
        ]);

        $this->post(route('cart.checkout'), $this->validCheckoutPayload([
            'items' => [
                ['id' => $product->id, 'quantity' => 2],
            ],
        ]))
            ->assertRedirect(route('cart.index'))
            ->assertSessionHasNoErrors();

        $order = Order::query()->first();

        $this->assertNotNull($order);
        $this->assertSame(Order::STATUS_PAID, $order->status);
        $this->assertSame('265.16', $order->total);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'email' => 'john@example.test',
            'user_id' => null,
            'subtotal' => '240.00',
            'shipping_total' => '5.00',
            'tax_total' => '20.16',
            'total' => '265.16',
        ]);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Trail Pack',
            'quantity' => 2,
            'unit_price' => '120.00',
            'line_total' => '240.00',
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 8,
        ]);
    }

    public function test_checkout_persists_selected_options_for_each_variant_line(): void
    {
        $product = Product::factory()->create([
            'name' => 'Variant Runner',
            'slug' => 'variant-runner',
            'price' => 100.00,
            'stock' => 10,
            'is_active' => true,
        ]);

        $this->post(route('cart.checkout'), $this->validCheckoutPayload([
            'items' => [
                [
                    'id' => $product->id,
                    'quantity' => 1,
                    'variant_key' => 'size-m',
                    'selected_options' => [
                        'brand' => 'Nike',
                        'model' => 'Pegasus 41',
                        'product_type' => 'clothing',
                        'clothing_size' => 'M',
                        'color' => 'Black',
                    ],
                ],
                [
                    'id' => $product->id,
                    'quantity' => 2,
                    'variant_key' => 'size-l',
                    'selected_options' => [
                        'brand' => 'Nike',
                        'model' => 'Pegasus 41',
                        'product_type' => 'clothing',
                        'clothing_size' => 'L',
                        'color' => 'Black',
                    ],
                ],
            ],
        ]))
            ->assertRedirect(route('cart.index'))
            ->assertSessionHasNoErrors();

        $order = Order::query()->first();

        $this->assertNotNull($order);
        $this->assertSame('330.20', $order->total);

        $items = $order->items()->orderBy('id')->get();

        $this->assertCount(2, $items);
        $this->assertSame('size-m', $items[0]->variant_key);
        $this->assertSame('M', $items[0]->selected_options['clothing_size'] ?? null);
        $this->assertSame('size-l', $items[1]->variant_key);
        $this->assertSame('L', $items[1]->selected_options['clothing_size'] ?? null);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 7,
        ]);
    }

    public function test_authenticated_user_can_complete_checkout_with_saved_payment_method(): void
    {
        $user = User::factory()->create([
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.test',
        ]);

        $paymentMethod = PaymentMethod::factory()
            ->for($user)
            ->asDefault()
            ->create();

        $product = Product::factory()->create([
            'name' => 'City Backpack',
            'slug' => 'city-backpack',
            'price' => 50.00,
            'stock' => 4,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->post(route('cart.checkout'), [
                'full_name' => 'Ada Lovelace',
                'email' => 'ada@example.test',
                'phone' => '5551234567',
                'address' => '42 Algorithm Street',
                'city' => 'London',
                'postal_code' => '10001',
                'country' => 'UK',
                'accepted' => true,
                'payment_method_id' => $paymentMethod->id,
                'items' => [
                    ['id' => $product->id, 'quantity' => 1],
                ],
            ])
            ->assertRedirect(route('account.orders.index'))
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('orders', [
            'user_id' => $user->id,
            'email' => 'ada@example.test',
            'status' => Order::STATUS_PAID,
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 3,
        ]);
    }

    public function test_cart_page_prefills_default_address_and_payment_method_when_available(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->for($user)->asDefault()->create();
        $paymentMethod = PaymentMethod::factory()->for($user)->asDefault()->create([
            'last_four' => '9999',
        ]);

        $this->actingAs($user)
            ->get(route('cart.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('cart/index')
                ->where('auth.default_address.id', $address->id)
                ->where('auth.default_payment_method.id', $paymentMethod->id)
                ->where('auth.default_payment_method.last_four', '9999')
            );
    }

    public function test_checkout_requires_payment_fields_without_saved_payment_method(): void
    {
        $product = Product::factory()->create([
            'price' => 20.00,
            'stock' => 5,
            'is_active' => true,
        ]);

        $this->from(route('cart.index'))
            ->post(route('cart.checkout'), [
                'full_name' => 'John Doe',
                'email' => 'john@example.test',
                'phone' => '5551234567',
                'address' => '123 Market Street',
                'city' => 'San Francisco',
                'postal_code' => '94103',
                'country' => 'US',
                'accepted' => true,
                'items' => [
                    ['id' => $product->id, 'quantity' => 1],
                ],
            ])
            ->assertRedirect(route('cart.index'))
            ->assertSessionHasErrors([
                'card_holder_name',
                'card_number',
                'cvc',
                'expiry_month',
                'expiry_year',
            ]);

        $this->assertDatabaseCount('orders', 0);
    }

    public function test_checkout_fails_when_quantity_exceeds_stock(): void
    {
        $product = Product::factory()->create([
            'name' => 'Mini Pouch',
            'price' => 10.00,
            'stock' => 1,
            'is_active' => true,
        ]);

        $this->from(route('cart.index'))
            ->post(route('cart.checkout'), $this->validCheckoutPayload([
                'items' => [
                    ['id' => $product->id, 'quantity' => 2],
                ],
            ]))
            ->assertRedirect(route('cart.index'))
            ->assertSessionHasErrors(['items']);

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'stock' => 1,
        ]);
    }

    public function test_checkout_supports_legacy_order_tables_without_modern_columns(): void
    {
        $this->rebuildLegacyOrderTables();

        $product = Product::factory()->create([
            'name' => 'Legacy Pack',
            'slug' => 'legacy-pack',
            'price' => 120.00,
            'stock' => 10,
            'is_active' => true,
        ]);

        $this->post(route('cart.checkout'), $this->validCheckoutPayload([
            'items' => [
                ['id' => $product->id, 'quantity' => 2],
            ],
        ]))
            ->assertRedirect(route('cart.index'))
            ->assertSessionHasNoErrors();

        $order = Order::query()->first();

        $this->assertNotNull($order);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.test',
            'subtotal_cents' => 24000,
            'shipping_cents' => 500,
            'tax_cents' => 2016,
            'total_cents' => 26516,
        ]);

        $this->assertDatabaseHas('order_items', [
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Legacy Pack',
            'product_slug' => 'legacy-pack',
            'quantity' => 2,
            'unit_price_cents' => 12000,
            'line_total_cents' => 24000,
        ]);
    }

    private function validCheckoutPayload(array $overrides = []): array
    {
        return array_replace_recursive([
            'full_name' => 'John Doe',
            'email' => 'john@example.test',
            'phone' => '5551234567',
            'address' => '123 Market Street',
            'city' => 'San Francisco',
            'postal_code' => '94103',
            'country' => 'US',
            'accepted' => true,
            'card_holder_name' => 'John Doe',
            'card_number' => '4242424242424242',
            'cvc' => '123',
            'expiry_month' => 12,
            'expiry_year' => now()->year + 2,
            'items' => [],
        ], $overrides);
    }

    private function rebuildLegacyOrderTables(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::enableForeignKeyConstraints();

        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->char('public_id', 36)->unique();
            $table->string('status', 20)->default(Order::STATUS_PENDING)->index();
            $table->string('customer_tier', 20)->nullable()->index();
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('email');
            $table->string('phone', 30)->nullable();
            $table->string('address1');
            $table->string('address2')->nullable();
            $table->string('city', 120);
            $table->string('postal_code', 20);
            $table->string('country', 120);
            $table->char('currency', 3)->default('EUR');
            $table->unsignedBigInteger('subtotal_cents');
            $table->unsignedBigInteger('tax_cents')->default(0);
            $table->unsignedBigInteger('shipping_cents')->default(0);
            $table->unsignedBigInteger('total_cents');
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_name');
            $table->string('product_slug')->nullable();
            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('unit_price_cents');
            $table->unsignedBigInteger('line_total_cents');
            $table->timestamps();

            $table->index('order_id');
            $table->index('product_id');
        });
    }
}
