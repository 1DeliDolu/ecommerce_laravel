<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    private string $token = 'test-cart-token-1234567890';

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Make a request with the guest cart token cookie. */
    private function withCartToken(): static
    {
        return $this->withCookie('cart_token', $this->token);
    }

    /** Create a persisted Guest Cart with the test token. */
    private function makeCart(): Cart
    {
        return Cart::factory()->create([
            'token' => $this->token,
            'user_id' => null,
            'status' => 'active',
        ]);
    }

    /** Add a raw CartItem to an existing Cart. */
    private function addItem(Cart $cart, Product $product, int $qty = 1): CartItem
    {
        return CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => $qty,
            'unit_price' => $product->price,
        ]);
    }

    // -------------------------------------------------------------------------
    // index
    // -------------------------------------------------------------------------

    public function test_cart_page_renders_for_guests(): void
    {
        $response = $this->withCartToken()->get(route('shop.cart.index'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page->component('cart/index'));
    }

    public function test_cart_page_shows_empty_cart_state(): void
    {
        $response = $this->withCartToken()->get(route('shop.cart.index'));

        $response->assertInertia(fn ($page) => $page
            ->component('cart/index')
            ->where('cart.items', [])
            ->where('cart.summary.items_count', 0)
            ->where('cart.summary.unique_items_count', 0)
            ->where('cart.summary.subtotal_cents', 0)
            ->where('cart.summary.subtotal', '0.00')
        );
    }

    // -------------------------------------------------------------------------
    // store
    // -------------------------------------------------------------------------

    public function test_adding_an_active_product_creates_cart_item(): void
    {
        $product = Product::factory()->create([
            'is_active' => true,
            'price' => '19.99',
        ]);

        $response = $this->withCartToken()->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 2,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Added to cart.');

        $cart = Cart::where('token', $this->token)->first();
        $this->assertNotNull($cart);

        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $product->id)->first();
        $this->assertNotNull($item);
        $this->assertSame(2, $item->quantity);
        $this->assertSame(1999, $item->unitPriceCents());
        $this->assertSame(3998, $item->lineTotalCents());
    }

    public function test_adding_same_product_twice_increments_quantity(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);

        $this->withCartToken()->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 3]);
        $this->withCartToken()->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 2]);

        $cart = Cart::where('token', $this->token)->first();
        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $product->id)->first();
        $this->assertSame(5, $item->quantity);
    }

    public function test_adding_product_caps_quantity_at_99(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '5.00']);

        $this->withCartToken()->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 90]);
        $this->withCartToken()->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 50]);

        $cart = Cart::where('token', $this->token)->first();
        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $product->id)->first();
        $this->assertSame(99, $item->quantity);
    }

    public function test_adding_inactive_product_fails_validation(): void
    {
        $product = Product::factory()->inactive()->create();

        $response = $this->withCartToken()->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
        $this->assertDatabaseCount('carts', 0);
    }

    public function test_adding_nonexistent_product_fails_validation(): void
    {
        $response = $this->withCartToken()->post(route('shop.cart.store'), [
            'product_id' => 99999,
            'qty' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
    }

    public function test_qty_below_minimum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->withCartToken()->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 0,
        ]);

        $response->assertSessionHasErrors('qty');
    }

    public function test_qty_above_maximum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->withCartToken()->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 100,
        ]);

        $response->assertSessionHasErrors('qty');
    }

    public function test_store_snapshots_unit_price_at_time_of_add(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '29.99']);

        $this->withCartToken()->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 1]);

        // Update the product price after adding to cart.
        $product->update(['price' => '99.99']);

        $cart = Cart::where('token', $this->token)->first();
        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $product->id)->first();

        $this->assertSame(2999, $item->unitPriceCents());
        $this->assertSame('29.99', (string) $item->unit_price);
    }

    public function test_summary_is_recalculated_after_store(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);

        $this->withCartToken()->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 3]);

        $cart = Cart::where('token', $this->token)->first();
        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $product->id)->first();

        $this->assertSame(3, $item->quantity);
        $this->assertSame(1000, $item->unitPriceCents());
        $this->assertSame(3000, $item->lineTotalCents());
    }

    // -------------------------------------------------------------------------
    // update
    // -------------------------------------------------------------------------

    public function test_updating_cart_item_changes_quantity_and_recalculates(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);
        $cart = $this->makeCart();
        $this->addItem($cart, $product, 1);

        $response = $this->withCartToken()->patch(route('shop.cart.update', $product->id), ['qty' => 5]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Cart updated.');

        $item = CartItem::where('cart_id', $cart->id)->where('product_id', $product->id)->first();
        $this->assertSame(5, $item->quantity);
        $this->assertSame(5000, $item->lineTotalCents());
        $this->assertSame('50.00', number_format($item->lineTotalCents() / 100, 2));
    }

    public function test_updating_nonexistent_cart_item_redirects_with_error(): void
    {
        $response = $this->withCartToken()->patch(route('shop.cart.update', 999), ['qty' => 2]);

        $response->assertRedirect();
        $response->assertSessionHas('error', 'Item not found in cart.');
    }

    public function test_update_qty_below_minimum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->withCartToken()->patch(route('shop.cart.update', $product->id), ['qty' => 0]);

        $response->assertSessionHasErrors('qty');
    }

    public function test_update_qty_above_maximum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->withCartToken()->patch(route('shop.cart.update', $product->id), ['qty' => 100]);

        $response->assertSessionHasErrors('qty');
    }

    // -------------------------------------------------------------------------
    // destroy
    // -------------------------------------------------------------------------

    public function test_removing_an_item_deletes_it_from_cart(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);
        $cart = $this->makeCart();
        $this->addItem($cart, $product, 2);

        $response = $this->withCartToken()->delete(route('shop.cart.destroy', $product->id));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Item removed.');

        $this->assertDatabaseMissing('cart_items', ['cart_id' => $cart->id, 'product_id' => $product->id]);
    }

    public function test_removing_one_item_leaves_other_items_intact(): void
    {
        $productA = Product::factory()->create(['is_active' => true, 'price' => '10.00']);
        $productB = Product::factory()->create(['is_active' => true, 'price' => '20.00']);
        $cart = $this->makeCart();
        $this->addItem($cart, $productA, 1);
        $this->addItem($cart, $productB, 2);

        $this->withCartToken()->delete(route('shop.cart.destroy', $productA->id));

        $this->assertDatabaseMissing('cart_items', ['cart_id' => $cart->id, 'product_id' => $productA->id]);
        $this->assertDatabaseHas('cart_items', ['cart_id' => $cart->id, 'product_id' => $productB->id, 'quantity' => 2]);
    }

    // -------------------------------------------------------------------------
    // clear
    // -------------------------------------------------------------------------

    public function test_clearing_cart_removes_all_items(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '5.00']);
        $cart = $this->makeCart();
        $this->addItem($cart, $product, 3);

        $response = $this->withCartToken()->delete(route('shop.cart.clear'));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Cart cleared.');
        $this->assertDatabaseMissing('cart_items', ['cart_id' => $cart->id]);
    }

    // -------------------------------------------------------------------------
    // Guest → User merge on login
    // -------------------------------------------------------------------------

    public function test_guest_cart_merges_into_user_cart_on_login(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '15.00']);
        $user = User::factory()->create();

        // Guest adds product to cart
        $guestCart = $this->makeCart();
        $this->addItem($guestCart, $product, 3);

        // User logs in carrying the guest token cookie
        $this->withCookie('cart_token', $this->token)
            ->actingAs($user)
            ->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 1]);

        // The guest cart row should be gone
        $this->assertDatabaseMissing('carts', ['id' => $guestCart->id]);

        // User owns a single active cart with the merged item
        $userCart = Cart::where('user_id', $user->id)->where('status', 'active')->first();
        $this->assertNotNull($userCart);

        $item = CartItem::where('cart_id', $userCart->id)->where('product_id', $product->id)->first();
        $this->assertNotNull($item);
    }
}
