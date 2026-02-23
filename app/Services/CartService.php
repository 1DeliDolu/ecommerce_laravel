<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Contracts\Session\Session;

class CartService
{
    public function __construct(private readonly Session $session) {}

    public function get(): array
    {
        return $this->session->get('cart', $this->emptyCart());
    }

    public function put(array $cart): void
    {
        $this->session->put('cart', $cart);
    }

    public function clear(): void
    {
        $this->session->forget('cart');
    }

    public function forInertia(): array
    {
        $cart = $this->get();

        return [
            'items' => array_values($cart['items']),
            'summary' => $this->summarize($cart['items']),
        ];
    }

    public function add(Product $product, int $qtyToAdd): array
    {
        $cart = $this->get();

        $productId = (int) $product->id;
        $unitPriceCents = $this->decimalToCents((string) $product->price);

        $existingQty = (int) ($cart['items'][$productId]['qty'] ?? 0);
        $newQty = min(99, $existingQty + max(1, $qtyToAdd));

        $lineTotalCents = $unitPriceCents * $newQty;

        $cart['items'][$productId] = [
            'product_id' => $productId,
            'name' => (string) $product->name,
            'slug' => (string) $product->slug,

            // snapshot
            'unit_price_cents' => $unitPriceCents,
            'unit_price' => $this->centsToDecimal($unitPriceCents),

            'qty' => $newQty,

            'line_total_cents' => $lineTotalCents,
            'line_total' => $this->centsToDecimal($lineTotalCents),
        ];

        $cart['summary'] = $this->summarize($cart['items']);
        $this->put($cart);

        return $cart;
    }

    public function updateQty(int $productId, int $qty): bool
    {
        $cart = $this->get();

        if (! isset($cart['items'][$productId])) {
            return false;
        }

        $qty = min(99, max(1, $qty));

        $item = $cart['items'][$productId];
        $unitPriceCents = (int) ($item['unit_price_cents'] ?? 0);

        $item['qty'] = $qty;
        $item['line_total_cents'] = $unitPriceCents * $qty;
        $item['line_total'] = $this->centsToDecimal((int) $item['line_total_cents']);

        $cart['items'][$productId] = $item;
        $cart['summary'] = $this->summarize($cart['items']);

        $this->put($cart);

        return true;
    }

    public function remove(int $productId): void
    {
        $cart = $this->get();

        unset($cart['items'][$productId]);

        $cart['summary'] = $this->summarize($cart['items']);
        $this->put($cart);
    }

    public function summarize(array $items): array
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

    private function emptyCart(): array
    {
        return [
            'items' => [],
            'summary' => [
                'items_count' => 0,
                'unique_items_count' => 0,
                'subtotal_cents' => 0,
                'subtotal' => '0.00',
            ],
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
