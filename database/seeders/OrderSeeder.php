<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    /** Orders to generate spread across the last 12 months. */
    private const TOTAL_ORDERS = 300;

    public function run(): void
    {
        $products = Product::query()
            ->where('is_active', true)
            ->get(['id', 'name', 'slug', 'price']);

        if ($products->isEmpty()) {
            $this->command->warn('No active products found — skipping OrderSeeder.');

            return;
        }

        $users = User::query()->pluck('id');
        $now = Carbon::now();
        $start = $now->copy()->subMonths(11)->startOfMonth();

        for ($i = 0; $i < self::TOTAL_ORDERS; $i++) {
            // Distribute orders randomly across the 12-month window (UTC avoids DST gaps)
            $createdAt = Carbon::createFromTimestampUTC(
                rand($start->timestamp, $now->timestamp)
            );

            $status = $this->randomStatus();

            // Build 1–4 items per order
            $items = $products->random(rand(1, min(4, $products->count())));
            $subtotalCents = 0;
            $itemRows = [];

            foreach ($items as $product) {
                $qty = rand(1, 3);
                $unitCents = (int) round((float) $product->price * 100);
                $lineCents = $unitCents * $qty;
                $subtotalCents += $lineCents;

                $itemRows[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'quantity' => $qty,
                    'unit_price_cents' => $unitCents,
                    'line_total_cents' => $lineCents,
                ];
            }

            $taxCents = (int) round($subtotalCents * 0.18);
            $shippingCents = 500;
            $totalCents = $subtotalCents + $taxCents + $shippingCents;

            $order = Order::create([
                'user_id' => $users->isNotEmpty() ? $users->random() : null,
                'public_id' => (string) Str::uuid(),
                'status' => $status,
                'first_name' => fake()->firstName(),
                'last_name' => fake()->lastName(),
                'email' => fake()->safeEmail(),
                'phone' => fake()->phoneNumber(),
                'address1' => fake()->streetAddress(),
                'address2' => null,
                'city' => fake()->city(),
                'postal_code' => fake()->postcode(),
                'country' => fake()->country(),
                'currency' => 'EUR',
                'subtotal_cents' => $subtotalCents,
                'tax_cents' => $taxCents,
                'shipping_cents' => $shippingCents,
                'total_cents' => $totalCents,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);

            foreach ($itemRows as $row) {
                $row['order_id'] = $order->id;
                $row['created_at'] = $createdAt;
                $row['updated_at'] = $createdAt;
                OrderItem::create($row);
            }
        }
    }

    private function randomStatus(): string
    {
        // Weighted: ~70% paid/shipped, ~20% pending, ~10% cancelled
        $rand = rand(1, 10);

        if ($rand <= 4) {
            return 'paid';
        }

        if ($rand <= 7) {
            return 'shipped';
        }

        if ($rand <= 9) {
            return 'pending';
        }

        return 'cancelled';
    }
}
