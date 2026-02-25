<?php

namespace Database\Factories;

use App\Enums\CustomerTier;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        $subtotal = $this->faker->randomFloat(2, 25, 900);
        $shipping = $this->faker->randomFloat(2, 0, 30);
        $tax = $this->faker->randomFloat(2, 0, 120);

        return [
            'public_id' => 'ORD-'.Str::upper(Str::random(10)),
            'user_id' => User::factory(),
            'status' => $this->faker->randomElement(Order::statuses()),
            'customer_tier' => $this->faker->randomElement(array_map(
                static fn (CustomerTier $tier): string => $tier->value,
                CustomerTier::cases(),
            )),
            'email' => $this->faker->safeEmail(),
            'customer_name' => $this->faker->name(),
            'phone' => $this->faker->optional(0.7)->phoneNumber(),
            'subtotal' => $subtotal,
            'shipping_total' => $shipping,
            'tax_total' => $tax,
            'total' => round($subtotal + $shipping + $tax, 2),
            'shipping_address_snapshot' => [
                'line1' => $this->faker->streetAddress(),
                'line2' => $this->faker->optional(0.2)->bothify('Apt ##?'),
                'city' => $this->faker->city(),
                'state' => $this->faker->state(),
                'postal_code' => $this->faker->postcode(),
                'country' => 'US',
            ],
            'placed_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => Order::STATUS_PENDING]);
    }

    public function paid(): static
    {
        return $this->state(fn () => ['status' => Order::STATUS_PAID]);
    }

    public function shipped(): static
    {
        return $this->state(fn () => ['status' => Order::STATUS_SHIPPED]);
    }

    public function cancelled(): static
    {
        return $this->state(fn () => ['status' => Order::STATUS_CANCELLED]);
    }
}
