<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCheckoutRequest;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CartCheckoutController extends Controller
{
    /**
     * @var array<string, array<string, bool>>
     */
    private array $columnExistenceMap = [];

    public function __invoke(StoreCheckoutRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $requestedLines = $this->resolveRequestedLines($validated['items']);
        $quantitiesByProductId = $this->resolveQuantitiesByProductId($requestedLines);
        $user = $request->user();

        $order = Product::query()->getConnection()->transaction(function () use ($requestedLines, $quantitiesByProductId, $validated, $user): Order {
            $productIds = array_keys($quantitiesByProductId);

            /** @var Collection<int, Product> $products */
            $products = Product::query()
                ->whereIn('id', $productIds)
                ->where('is_active', true)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            if ($products->count() !== count($productIds)) {
                throw ValidationException::withMessages([
                    'items' => 'One or more selected products are no longer available.',
                ]);
            }

            foreach ($quantitiesByProductId as $productId => $quantity) {
                $product = $products->get($productId);

                if (! $product instanceof Product) {
                    throw ValidationException::withMessages([
                        'items' => 'One or more selected products are no longer available.',
                    ]);
                }

                if ($product->stock < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => sprintf(
                            '"%s" has only %d item(s) left in stock.',
                            $product->name,
                            $product->stock,
                        ),
                    ]);
                }
            }

            $lineItems = collect($requestedLines)
                ->map(function (array $line) use ($products): array {
                    $product = $products->get($line['id']);

                    if (! $product instanceof Product) {
                        throw ValidationException::withMessages([
                            'items' => 'One or more selected products are no longer available.',
                        ]);
                    }

                    $unitPrice = round((float) $product->price, 2);

                    return [
                        'product' => $product,
                        'quantity' => $line['quantity'],
                        'variant_key' => $line['variant_key'],
                        'selected_options' => $line['selected_options'],
                        'unit_price' => $unitPrice,
                        'line_total' => round($line['quantity'] * $unitPrice, 2),
                    ];
                })
                ->values();

            $subtotal = round((float) $lineItems->sum('line_total'), 2);
            $shippingTotal = $subtotal > 0 ? 5.00 : 0.00;
            $taxTotal = round($subtotal * 0.084, 2);
            $total = round($subtotal + $shippingTotal + $taxTotal, 2);
            $nameParts = $this->splitFullName($validated['full_name']);
            $shippingAddressSnapshot = [
                'line1' => $validated['address'],
                'line2' => null,
                'city' => $validated['city'],
                'state' => null,
                'postal_code' => $validated['postal_code'],
                'country' => $validated['country'],
            ];

            $order = Order::query()->create($this->filterExistingColumns('orders', [
                'public_id' => $this->generatePublicOrderId(),
                'user_id' => $user?->id,
                'status' => Order::STATUS_PAID,
                'customer_tier' => $user?->tier,
                'email' => $validated['email'],
                'customer_name' => $validated['full_name'],
                'first_name' => $nameParts['first_name'],
                'last_name' => $nameParts['last_name'],
                'phone' => $validated['phone'] !== '' ? $validated['phone'] : null,
                'address1' => $validated['address'],
                'address2' => null,
                'city' => $validated['city'],
                'postal_code' => $validated['postal_code'],
                'country' => $validated['country'],
                'subtotal_cents' => $this->toCents($subtotal),
                'shipping_cents' => $this->toCents($shippingTotal),
                'tax_cents' => $this->toCents($taxTotal),
                'total_cents' => $this->toCents($total),
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'shipping_total' => number_format($shippingTotal, 2, '.', ''),
                'tax_total' => number_format($taxTotal, 2, '.', ''),
                'total' => number_format($total, 2, '.', ''),
                'shipping_address_snapshot' => $shippingAddressSnapshot,
                'placed_at' => now(),
            ]));

            $lineItems->each(function (array $lineItem) use ($order): void {
                /** @var Product $product */
                $product = $lineItem['product'];

                $order->items()->create($this->filterExistingColumns('order_items', [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'product_sku' => $product->sku,
                    'variant_key' => $lineItem['variant_key'],
                    'selected_options' => $lineItem['selected_options'],
                    'quantity' => $lineItem['quantity'],
                    'unit_price_cents' => $this->toCents((float) $lineItem['unit_price']),
                    'line_total_cents' => $this->toCents((float) $lineItem['line_total']),
                    'unit_price' => number_format($lineItem['unit_price'], 2, '.', ''),
                    'line_total' => number_format($lineItem['line_total'], 2, '.', ''),
                ]));
            });

            foreach ($quantitiesByProductId as $productId => $quantity) {
                $product = $products->get($productId);

                if ($product instanceof Product) {
                    $product->decrement('stock', $quantity);
                }
            }

            return $order;
        });

        $message = sprintf('Order %s placed successfully.', $order->public_id);

        if ($user !== null) {
            return to_route('account.orders.index')->with('success', $message);
        }

        return to_route('cart.index')->with('success', $message);
    }

    /**
     * @param  list<array{id: int, quantity: int, variant_key?: string|null, selected_options?: array<string, string>|null}>  $items
     * @return list<array{id: int, quantity: int, variant_key: string|null, selected_options: array<string, string>|null}>
     */
    private function resolveRequestedLines(array $items): array
    {
        return collect($items)
            ->map(fn (array $item): array => [
                'id' => (int) $item['id'],
                'quantity' => (int) $item['quantity'],
                'variant_key' => isset($item['variant_key']) && is_string($item['variant_key']) && trim($item['variant_key']) !== ''
                    ? trim($item['variant_key'])
                    : null,
                'selected_options' => is_array($item['selected_options'] ?? null)
                    ? $item['selected_options']
                    : null,
            ])
            ->values()
            ->all();
    }

    /**
     * @param  list<array{id: int, quantity: int, variant_key: string|null, selected_options: array<string, string>|null}>  $items
     * @return array<int, int>
     */
    private function resolveQuantitiesByProductId(array $items): array
    {
        return collect($items)
            ->groupBy('id')
            ->map(fn (Collection $group): int => (int) $group->sum('quantity'))
            ->mapWithKeys(fn (int $quantity, int|string $productId): array => [
                (int) $productId => $quantity,
            ])
            ->all();
    }

    private function generatePublicOrderId(): string
    {
        do {
            $publicId = 'ORD-'.Str::upper(Str::random(10));
        } while (Order::query()->where('public_id', $publicId)->exists());

        return $publicId;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function filterExistingColumns(string $table, array $attributes): array
    {
        if (! array_key_exists($table, $this->columnExistenceMap)) {
            $this->columnExistenceMap[$table] = collect(Schema::getColumnListing($table))
                ->mapWithKeys(static fn (string $column): array => [$column => true])
                ->all();
        }

        return collect($attributes)
            ->filter(function (mixed $value, string $column) use ($table): bool {
                return $this->columnExistenceMap[$table][$column] ?? false;
            })
            ->all();
    }

    /**
     * @return array{first_name: string, last_name: string}
     */
    private function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName));
        $parts = is_array($parts) ? $parts : [];

        $firstName = (string) array_shift($parts);
        $lastName = trim(implode(' ', $parts));

        return [
            'first_name' => $firstName !== '' ? $firstName : $fullName,
            'last_name' => $lastName,
        ];
    }

    private function toCents(float $amount): int
    {
        return (int) round($amount * 100);
    }
}
