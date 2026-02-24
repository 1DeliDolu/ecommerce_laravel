<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CheckoutStoreRequest;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function index(Request $request): Response
    {
        $cart = $this->getCart();
        $items = array_values($cart['items'] ?? []);

        // Summary yoksa (veya bozuksa) yeniden hesapla
        $summary = $cart['summary'] ?? $this->summarize($cart['items'] ?? []);
        if (! isset($summary['subtotal_cents'], $summary['items_count'], $summary['unique_items_count'])) {
            $summary = $this->summarize($cart['items'] ?? []);
        }

        return Inertia::render('checkout/index', [
            'cart' => [
                'items' => $items,
                'summary' => $summary,
            ],
        ]);
    }

    public function store(CheckoutStoreRequest $request): RedirectResponse
    {
        $cart = $this->getCart();

        if (empty($cart['items'])) {
            return back()->with('error', 'Your cart is empty.');
        }

        // Summary yoksa hesapla
        $summary = $cart['summary'] ?? $this->summarize($cart['items']);
        $subtotalCents = (int) ($summary['subtotal_cents'] ?? 0);

        if ($subtotalCents <= 0) {
            return back()->with('error', 'Your cart is empty.');
        }

        // Şimdilik sabit/hesap (Cart UI ile uyumlu)
        $shippingCents = 500;
        $taxRate = 0.084;

        $taxCents = (int) round($subtotalCents * $taxRate);
        $totalCents = $subtotalCents + $shippingCents + $taxCents;

        $user = $request->user();

        $order = DB::transaction(function () use (
            $request,
            $user,
            $cart,
            $subtotalCents,
            $taxCents,
            $shippingCents,
            $totalCents
        ) {
            /** @var \App\Models\Order $order */
            $order = Order::create([
                'user_id' => $user?->id,
                'status' => 'pending',

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

            foreach (($cart['items'] ?? []) as $item) {
                $qty = (int) ($item['qty'] ?? 0);
                $unitPriceCents = (int) ($item['unit_price_cents'] ?? 0);

                if ($qty <= 0 || $unitPriceCents < 0) {
                    continue;
                }

                $lineTotalCents = $unitPriceCents * $qty;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => isset($item['product_id']) ? (int) $item['product_id'] : null,
                    'product_name' => (string) ($item['name'] ?? 'Unknown product'),
                    'product_slug' => $item['slug'] ?? null,
                    'quantity' => $qty,
                    'unit_price_cents' => $unitPriceCents,
                    'line_total_cents' => $lineTotalCents,
                ]);
            }

            return $order;
        });

        // ✅ Session cart temizle
        session()->forget('cart');

        return redirect()->route('shop.checkout.success', ['publicId' => $order->public_id]);
    }

    public function success(Request $request, string $publicId): Response
    {
        $order = Order::query()
            ->where('public_id', $publicId)
            ->with(['items:id,order_id,product_name,product_slug,quantity,unit_price_cents,line_total_cents'])
            ->firstOrFail();

        // Basit güvenlik: order user’a bağlıysa sadece sahibi görebilsin
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

    private function getCart(): array
    {
        return session()->get('cart', [
            'items' => [],
            'summary' => [
                'items_count' => 0,
                'unique_items_count' => 0,
                'subtotal_cents' => 0,
                'subtotal' => '0.00',
            ],
        ]);
    }

    private function summarize(array $items): array
    {
        $itemsCount = 0;
        $subtotalCents = 0;

        foreach ($items as $item) {
            $qty = (int) ($item['qty'] ?? 0);
            $unitPriceCents = (int) ($item['unit_price_cents'] ?? 0);

            $itemsCount += $qty;
            $subtotalCents += $unitPriceCents * $qty;
        }

        return [
            'items_count' => $itemsCount,
            'unique_items_count' => count($items),
            'subtotal_cents' => $subtotalCents,
            'subtotal' => $this->centsToDecimal($subtotalCents),
        ];
    }

    private function centsToDecimal(int $cents): string
    {
        $negative = $cents < 0;
        $cents = abs($cents);

        $whole = intdiv($cents, 100);
        $fraction = $cents % 100;

        $formatted = sprintf('%d.%02d', $whole, $fraction);

        return $negative ? '-'.$formatted : $formatted;
    }
}
