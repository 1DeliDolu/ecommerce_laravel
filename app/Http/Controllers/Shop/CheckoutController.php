<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Middleware\EnsureCartToken;
use App\Http\Requests\Shop\CheckoutStoreRequest;
use App\Mail\OrderPlaced;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\CartService;
use App\Services\PricingContext;
use App\Services\TierPricingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly TierPricingService $pricing,
    ) {}

    public function index(Request $request): Response
    {
        $cart = $this->cartService->resolve(
            $request->user(),
            $request->cookie(EnsureCartToken::COOKIE_NAME),
        );

        $cartData = $cart->exists
            ? $this->cartService->forInertia($cart)
            : ['items' => [], 'summary' => $this->emptySummary()];

        return Inertia::render('checkout/index', ['cart' => $cartData]);
    }

    public function store(CheckoutStoreRequest $request): RedirectResponse
    {
        $cart = $this->cartService->resolve(
            $request->user(),
            $request->cookie(EnsureCartToken::COOKIE_NAME),
        );

        if (! $cart->exists) {
            return back()->with('error', 'Your cart is empty.');
        }

        $items = $this->cartService->itemsForCheckout($cart);

        if (empty($items)) {
            return back()->with('error', 'Your cart is empty.');
        }

        $subtotalCents = array_sum(
            array_map(fn ($i) => (int) $i['unit_price_cents'] * (int) $i['qty'], $items)
        );

        if ($subtotalCents <= 0) {
            return back()->with('error', 'Your cart is empty.');
        }

        $user = $request->user();
        $pricingCtx = new PricingContext($user, $items);

        $shippingCents = $this->pricing->hasFreeShipping($pricingCtx, $subtotalCents) ? 0 : 500;
        $discountCents = $this->pricing->discountCents($pricingCtx, $subtotalCents);
        $taxCents = (int) round($subtotalCents * 0.084);
        $totalCents = $subtotalCents - $discountCents + $shippingCents + $taxCents;

        $order = DB::transaction(function () use (
            $request,
            $user,
            $items,
            $subtotalCents,
            $taxCents,
            $shippingCents,
            $totalCents,
            $pricingCtx,
            $cart
        ) {
            /** @var \App\Models\Order $order */
            $order = Order::create([
                'user_id' => $user?->id,
                'status' => 'pending',
                'customer_tier' => $pricingCtx->tier->value,

                'first_name' => (string) $request->string('first_name'),
                'last_name' => (string) $request->string('last_name'),
                'email' => (string) $request->string('email'),
                'phone' => $request->input('phone'),

                'address1' => (string) $request->string('address1'),
                'address2' => $request->input('address2'),
                'city' => (string) $request->string('city'),
                'postal_code' => (string) $request->string('postal_code'),
                'country' => (string) $request->string('country'),

                'currency' => 'EUR',
                'subtotal_cents' => $subtotalCents,
                'tax_cents' => $taxCents,
                'shipping_cents' => $shippingCents,
                'total_cents' => $totalCents,
            ]);

            foreach ($items as $item) {
                $qty = (int) $item['qty'];
                $unitPriceCents = (int) $item['unit_price_cents'];

                if ($qty <= 0 || $unitPriceCents < 0) {
                    continue;
                }

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => isset($item['product_id']) ? (int) $item['product_id'] : null,
                    'product_name' => (string) ($item['name'] ?? 'Unknown product'),
                    'product_slug' => $item['slug'] ?? null,
                    'quantity' => $qty,
                    'unit_price_cents' => $unitPriceCents,
                    'line_total_cents' => $unitPriceCents * $qty,
                ]);
            }

            $this->cartService->clear($cart);

            return $order;
        });

        Mail::to($order->email)->send(new OrderPlaced($order));

        return redirect()->route('shop.checkout.success', ['publicId' => $order->public_id]);
    }

    public function success(Request $request, string $publicId): Response
    {
        $order = Order::query()
            ->where('public_id', $publicId)
            ->with(['items:id,order_id,product_name,product_slug,quantity,unit_price_cents,line_total_cents'])
            ->firstOrFail();

        // Basit güvenlik: order user'a bağlıysa sadece sahibi görebilsin
        if ($order->user_id !== null) {
            $user = $request->user();
            if (! $user || (int) $user->id !== (int) $order->user_id) {
                abort(404);
            }
        }

        return Inertia::render('checkout/success', [
            'order' => [
                'public_id' => $order->public_id,
                'status' => $order->status,
                'email' => $order->email,
                'created_at' => $order->created_at?->toISOString(),

                'currency' => $order->currency,
                'subtotal_cents' => (int) $order->subtotal_cents,
                'tax_cents' => (int) $order->tax_cents,
                'shipping_cents' => (int) $order->shipping_cents,
                'total_cents' => (int) $order->total_cents,

                'subtotal' => number_format(((int) $order->subtotal_cents) / 100, 2),
                'tax' => number_format(((int) $order->tax_cents) / 100, 2),
                'shipping' => number_format(((int) $order->shipping_cents) / 100, 2),
                'total' => number_format(((int) $order->total_cents) / 100, 2),

                'items' => $order->items->map(fn ($it) => [
                    'name' => $it->product_name,
                    'slug' => $it->product_slug,
                    'qty' => (int) $it->quantity,
                    'unit_price' => number_format(((int) $it->unit_price_cents) / 100, 2),
                    'line_total' => number_format(((int) $it->line_total_cents) / 100, 2),
                ])->values()->all(),
            ],
        ]);
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
