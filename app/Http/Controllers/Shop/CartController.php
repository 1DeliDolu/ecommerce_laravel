<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\AddToCartRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    public function index(Request $request): Response
    {
        $cart = $this->getCart();

        return Inertia::render('cart/index', [
            'cart' => [
                'items' => array_values($cart['items']),
                'summary' => $this->summarize($cart['items']),
            ],
        ]);
    }

    public function store(AddToCartRequest $request): RedirectResponse
    {
        $productId = $request->integer('product_id');
        $qtyToAdd = $request->integer('qty');

        $product = Product::query()
            ->select(['id', 'name', 'slug', 'price'])
            ->whereKey($productId)
            ->where('is_active', true)
            ->firstOrFail();

        $cart = $this->getCart();

        $unitPriceCents = $this->decimalToCents((string) $product->price);
        $existingQty = (int) ($cart['items'][$productId]['qty'] ?? 0);
        $newQty = min(99, $existingQty + $qtyToAdd);

        $lineTotalCents = $unitPriceCents * $newQty;

        $cart['items'][$productId] = [
            'product_id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,

            // snapshot
            'unit_price_cents' => $unitPriceCents,
            'unit_price' => $this->centsToDecimal($unitPriceCents),

            'qty' => $newQty,

            'line_total_cents' => $lineTotalCents,
            'line_total' => $this->centsToDecimal($lineTotalCents),
        ];

        $cart['summary'] = $this->summarize($cart['items']);
        session()->put('cart', $cart);

        return redirect()->back()->with('success', 'Added to cart.');
    }

    public function update(UpdateCartItemRequest $request, int $productId): RedirectResponse
    {
        $validated = $request->validated();

        $cart = $this->getCart();

        if (! isset($cart['items'][$productId])) {
            return redirect()->back()->with('error', 'Item not found in cart.');
        }

        $item = $cart['items'][$productId];

        $item['qty'] = (int) $validated['qty'];
        $item['line_total_cents'] = (int) $item['unit_price_cents'] * (int) $item['qty'];
        $item['line_total'] = $this->centsToDecimal((int) $item['line_total_cents']);

        $cart['items'][$productId] = $item;
        $cart['summary'] = $this->summarize($cart['items']);
        session()->put('cart', $cart);

        return redirect()->back()->with('success', 'Cart updated.');
    }

    public function destroy(Request $request, int $productId): RedirectResponse
    {
        $cart = $this->getCart();

        unset($cart['items'][$productId]);

        $cart['summary'] = $this->summarize($cart['items']);
        session()->put('cart', $cart);

        return redirect()->back()->with('success', 'Item removed.');
    }

    public function clear(): RedirectResponse
    {
        session()->forget('cart');

        return redirect()->back()->with('success', 'Cart cleared.');
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

    private function decimalToCents(string $value): int
    {
        $value = trim($value);

        if ($value === '') {
            return 0;
        }

        $negative = str_starts_with($value, '-');
        if ($negative) {
            $value = ltrim($value, '-');
        }

        if (! str_contains($value, '.')) {
            $cents = ((int) $value) * 100;

            return $negative ? -$cents : $cents;
        }

        [$whole, $fraction] = explode('.', $value, 2);
        $whole = $whole === '' ? '0' : $whole;

        $fraction = preg_replace('/\D/', '', $fraction ?? '');
        $fraction = substr(str_pad($fraction, 2, '0'), 0, 2);

        $cents = ((int) $whole) * 100 + (int) $fraction;

        return $negative ? -$cents : $cents;
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
