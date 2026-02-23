<?php

namespace Tests\Feature;

use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // index
    // -------------------------------------------------------------------------

    public function test_cart_page_renders_for_guests(): void
    {
        $response = $this->get(route('shop.cart.index'));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page->component('cart/index'));
    }

    public function test_cart_page_shows_empty_cart_state(): void
    {
        $response = $this->get(route('shop.cart.index'));

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

        $response = $this->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 2,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Added to cart.');

        $cart = session('cart');
        $this->assertArrayHasKey($product->id, $cart['items']);
        $this->assertSame(2, $cart['items'][$product->id]['qty']);
        $this->assertSame(1999, $cart['items'][$product->id]['unit_price_cents']);
        $this->assertSame(3998, $cart['items'][$product->id]['line_total_cents']);
    }

    public function test_adding_same_product_twice_increments_quantity(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);

        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 3]);
        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 2]);

        $cart = session('cart');
        $this->assertSame(5, $cart['items'][$product->id]['qty']);
    }

    public function test_adding_product_caps_quantity_at_99(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '5.00']);

        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 90]);
        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 50]);

        $cart = session('cart');
        $this->assertSame(99, $cart['items'][$product->id]['qty']);
    }

    public function test_adding_inactive_product_fails_validation(): void
    {
        $product = Product::factory()->inactive()->create();

        $response = $this->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
        $this->assertNull(session('cart'));
    }

    public function test_adding_nonexistent_product_fails_validation(): void
    {
        $response = $this->post(route('shop.cart.store'), [
            'product_id' => 99999,
            'qty' => 1,
        ]);

        $response->assertSessionHasErrors('product_id');
    }

    public function test_qty_below_minimum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 0,
        ]);

        $response->assertSessionHasErrors('qty');
    }

    public function test_qty_above_maximum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->post(route('shop.cart.store'), [
            'product_id' => $product->id,
            'qty' => 100,
        ]);

        $response->assertSessionHasErrors('qty');
    }

    public function test_store_snapshots_unit_price_at_time_of_add(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '29.99']);

        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 1]);

        // Update the product price after adding to cart.
        $product->update(['price' => '99.99']);

        $cart = session('cart');
        $this->assertSame(2999, $cart['items'][$product->id]['unit_price_cents']);
        $this->assertSame('29.99', $cart['items'][$product->id]['unit_price']);
    }

    public function test_summary_is_recalculated_after_store(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);

        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 3]);

        $cart = session('cart');
        $this->assertSame(3, $cart['summary']['items_count']);
        $this->assertSame(1, $cart['summary']['unique_items_count']);
        $this->assertSame(3000, $cart['summary']['subtotal_cents']);
        $this->assertSame('30.00', $cart['summary']['subtotal']);
    }

    // -------------------------------------------------------------------------
    // update
    // -------------------------------------------------------------------------

    public function test_updating_cart_item_changes_quantity_and_recalculates(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);
        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 1]);

        $response = $this->patch(route('shop.cart.update', $product->id), ['qty' => 5]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Cart updated.');

        $cart = session('cart');
        $this->assertSame(5, $cart['items'][$product->id]['qty']);
        $this->assertSame(5000, $cart['items'][$product->id]['line_total_cents']);
        $this->assertSame('50.00', $cart['items'][$product->id]['line_total']);
        $this->assertSame(5, $cart['summary']['items_count']);
        $this->assertSame(5000, $cart['summary']['subtotal_cents']);
    }

    public function test_updating_nonexistent_cart_item_redirects_with_error(): void
    {
        $response = $this->patch(route('shop.cart.update', 999), ['qty' => 2]);

        $response->assertRedirect();
        $response->assertSessionHas('error', 'Item not found in cart.');
    }

    public function test_update_qty_below_minimum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->patch(route('shop.cart.update', $product->id), ['qty' => 0]);

        $response->assertSessionHasErrors('qty');
    }

    public function test_update_qty_above_maximum_fails_validation(): void
    {
        $product = Product::factory()->create(['is_active' => true]);

        $response = $this->patch(route('shop.cart.update', $product->id), ['qty' => 100]);

        $response->assertSessionHasErrors('qty');
    }

    // -------------------------------------------------------------------------
    // destroy
    // -------------------------------------------------------------------------

    public function test_removing_an_item_deletes_it_from_cart(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '10.00']);
        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 2]);

        $response = $this->delete(route('shop.cart.destroy', $product->id));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Item removed.');

        $cart = session('cart');
        $this->assertArrayNotHasKey($product->id, $cart['items']);
        $this->assertSame(0, $cart['summary']['items_count']);
    }

    public function test_removing_one_item_leaves_other_items_intact(): void
    {
        $productA = Product::factory()->create(['is_active' => true, 'price' => '10.00']);
        $productB = Product::factory()->create(['is_active' => true, 'price' => '20.00']);

        $this->post(route('shop.cart.store'), ['product_id' => $productA->id, 'qty' => 1]);
        $this->post(route('shop.cart.store'), ['product_id' => $productB->id, 'qty' => 2]);

        $this->delete(route('shop.cart.destroy', $productA->id));

        $cart = session('cart');
        $this->assertArrayNotHasKey($productA->id, $cart['items']);
        $this->assertArrayHasKey($productB->id, $cart['items']);
        $this->assertSame(2, $cart['summary']['items_count']);
        $this->assertSame(4000, $cart['summary']['subtotal_cents']);
    }

    // -------------------------------------------------------------------------
    // clear
    // -------------------------------------------------------------------------

    public function test_clearing_cart_removes_entire_session_cart(): void
    {
        $product = Product::factory()->create(['is_active' => true, 'price' => '5.00']);
        $this->post(route('shop.cart.store'), ['product_id' => $product->id, 'qty' => 3]);

        $response = $this->delete(route('shop.cart.clear'));

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Cart cleared.');
        $this->assertNull(session('cart'));
    }
}
