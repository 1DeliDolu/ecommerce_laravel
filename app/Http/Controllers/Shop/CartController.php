<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureCartToken;
use App\Http\Requests\Cart\AddToCartRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Models\Product;
use App\Services\CartService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function __construct(private readonly CartService $cartService) {}

    public function index(Request $request): Response
    {
        $cart = $this->cartService->resolve(
            $request->user(),
            $request->cookie(EnsureCartToken::COOKIE_NAME),
        );

        return Inertia::render('cart/index', [
            'cart' => $cart->exists
                ? $this->cartService->forInertia($cart)
                : ['items' => [], 'summary' => $this->emptySummary()],
        ]);
    }

    public function store(AddToCartRequest $request): RedirectResponse
    {
        $product = Product::query()
            ->select(['id', 'name', 'slug', 'price'])
            ->whereKey($request->integer('product_id'))
            ->where('is_active', true)
            ->firstOrFail();

        $cart = $this->cartService->resolve(
            $request->user(),
            $request->cookie(EnsureCartToken::COOKIE_NAME),
        );

        // Persist unsaved cart first (guest with no prior row)
        if (! $cart->exists) {
            $cart->token = $request->cookie(EnsureCartToken::COOKIE_NAME);
            $cart->save();
        }

        $this->cartService->add($cart, $product, $request->integer('qty'));

        return redirect()->back()->with('success', 'Added to cart.');
    }

    public function update(UpdateCartItemRequest $request, int $productId): RedirectResponse
    {
        $cart = $this->cartService->resolve(
            $request->user(),
            $request->cookie(EnsureCartToken::COOKIE_NAME),
        );

        if (! $cart->exists) {
            return redirect()->back()->with('error', 'Item not found in cart.');
        }

        $updated = $this->cartService->updateQty(
            $cart,
            $productId,
            $request->integer('qty'),
        );

        return redirect()->back()->with(
            $updated ? 'success' : 'error',
            $updated ? 'Cart updated.' : 'Item not found in cart.',
        );
    }

    public function destroy(Request $request, int $productId): RedirectResponse
    {
        $cart = $this->cartService->resolve(
            $request->user(),
            $request->cookie(EnsureCartToken::COOKIE_NAME),
        );

        if ($cart->exists) {
            $this->cartService->remove($cart, $productId);
        }

        return redirect()->back()->with('success', 'Item removed.');
    }

    public function clear(Request $request): RedirectResponse
    {
        $cart = $this->cartService->resolve(
            $request->user(),
            $request->cookie(EnsureCartToken::COOKIE_NAME),
        );

        if ($cart->exists) {
            $this->cartService->clear($cart);
        }

        return redirect()->back()->with('success', 'Cart cleared.');
    }

    /** @return array<string,mixed> */
    private function emptySummary(): array
    {
        return [
            'items_count' => 0,
            'unique_items_count' => 0,
            'subtotal_cents' => 0,
            'subtotal' => '0.00',
        ];
    }
}
