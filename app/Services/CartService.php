<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;

class CartService
{
    /**
     * Resolve the active Cart for a user or guest token.
     * Creates one if it doesn't exist yet.
     */
    public function resolve(?User $user, ?string $token): Cart
    {
        // Authenticated user → look for existing user cart
        if ($user) {
            // Auto-merge guest cart if a guest token is present
            if ($token) {
                $this->mergeGuestIntoUser($user, $token);
            }

            return Cart::query()
                ->where('user_id', $user->id)
                ->where('status', 'active')
                ->firstOrCreate(
                    ['user_id' => $user->id, 'status' => 'active'],
                    ['token' => null],
                );
        }

        // Guest → look up by token
        if ($token) {
            return Cart::query()->firstOrCreate(
                ['token' => $token, 'user_id' => null, 'status' => 'active'],
            );
        }

        // Fallback: unsaved in-memory cart (token not yet set)
        return new Cart(['status' => 'active']);
    }

    /**
     * Merge a guest cart into a user cart on login.
     * Guest cart items are moved/merged then the guest cart is deleted.
     */
    public function mergeGuestIntoUser(User $user, string $token): void
    {
        $guestCart = Cart::query()
            ->whereNull('user_id')
            ->where('token', $token)
            ->where('status', 'active')
            ->with('items')
            ->first();

        if (! $guestCart || $guestCart->items->isEmpty()) {
            return;
        }

        $userCart = Cart::query()
            ->where('user_id', $user->id)
            ->where('status', 'active')
            ->with('items')
            ->firstOrCreate(
                ['user_id' => $user->id, 'status' => 'active'],
                ['token' => null],
            );

        foreach ($guestCart->items as $guestItem) {
            $existing = $userCart->items->firstWhere('product_id', $guestItem->product_id);

            if ($existing) {
                $newQty = min(99, $existing->quantity + $guestItem->quantity);
                $existing->update(['quantity' => $newQty]);
            } else {
                CartItem::create([
                    'cart_id' => $userCart->id,
                    'product_id' => $guestItem->product_id,
                    'quantity' => $guestItem->quantity,
                    'unit_price' => $guestItem->unit_price,
                ]);
            }
        }

        $guestCart->delete();
    }

    public function add(Cart $cart, Product $product, int $qtyToAdd): void
    {
        $cart->loadMissing('items');

        $existing = $cart->items->firstWhere('product_id', $product->id);
        $newQty = min(99, ($existing?->quantity ?? 0) + max(1, $qtyToAdd));

        if ($existing) {
            $existing->update(['quantity' => $newQty]);
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => $newQty,
                'unit_price' => $product->price,
            ]);
        }
    }

    public function updateQty(Cart $cart, int $productId, int $qty): bool
    {
        $cart->loadMissing('items');

        $item = $cart->items->firstWhere('product_id', $productId);

        if (! $item) {
            return false;
        }

        $item->update(['quantity' => min(99, max(1, $qty))]);

        return true;
    }

    public function remove(Cart $cart, int $productId): void
    {
        CartItem::query()
            ->where('cart_id', $cart->id)
            ->where('product_id', $productId)
            ->delete();
    }

    public function clear(Cart $cart): void
    {
        CartItem::query()->where('cart_id', $cart->id)->delete();
    }

    /**
     * Return the cart shaped for Inertia / frontend.
     *
     * @return array{items: list<array<string,mixed>>, summary: array<string,mixed>}
     */
    public function forInertia(Cart $cart): array
    {
        $cart->loadMissing(['items.product']);

        $items = $cart->items->map(function (CartItem $item): array {
            $unitPriceCents = $item->unitPriceCents();
            $lineTotalCents = $item->lineTotalCents();

            return [
                'product_id' => $item->product_id,
                'name' => $item->product?->name ?? 'Unknown product',
                'slug' => $item->product?->slug ?? '',
                'unit_price_cents' => $unitPriceCents,
                'unit_price' => $this->centsToDecimal($unitPriceCents),
                'qty' => $item->quantity,
                'line_total_cents' => $lineTotalCents,
                'line_total' => $this->centsToDecimal($lineTotalCents),
            ];
        });

        return [
            'items' => $items->values()->all(),
            'summary' => $this->summarizeItems($items),
        ];
    }

    /**
     * Return items keyed by product_id for use in CheckoutController.
     *
     * @return array<int, array<string,mixed>>
     */
    public function itemsForCheckout(Cart $cart): array
    {
        $cart->loadMissing('items');

        $keyed = [];
        foreach ($cart->items as $item) {
            $unitPriceCents = $item->unitPriceCents();
            $keyed[$item->product_id] = [
                'product_id' => $item->product_id,
                'name' => $item->product?->name ?? 'Unknown product',
                'slug' => $item->product?->slug ?? '',
                'unit_price_cents' => $unitPriceCents,
                'qty' => $item->quantity,
            ];
        }

        return $keyed;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * @param  Collection<int, array<string,mixed>>  $items
     * @return array<string,mixed>
     */
    private function summarizeItems(Collection $items): array
    {
        $itemsCount = 0;
        $subtotalCents = 0;

        foreach ($items as $item) {
            $itemsCount += (int) ($item['qty'] ?? 0);
            $subtotalCents += (int) ($item['line_total_cents'] ?? 0);
        }

        return [
            'items_count' => $itemsCount,
            'unique_items_count' => $items->count(),
            'subtotal_cents' => $subtotalCents,
            'subtotal' => $this->centsToDecimal($subtotalCents),
        ];
    }

    private function centsToDecimal(int $cents): string
    {
        $negative = $cents < 0;
        $cents = abs($cents);

        $formatted = sprintf('%d.%02d', intdiv($cents, 100), $cents % 100);

        return $negative ? '-'.$formatted : $formatted;
    }
}
