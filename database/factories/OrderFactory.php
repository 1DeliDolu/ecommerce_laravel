<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(500, 10000);
        $tax = (int) round($subtotal * 0.18);
        $shipping = 500;

        return [
            'user_id' => null,
            'status' => 'pending',
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'email' => $this->faker->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'address1' => $this->faker->streetAddress(),
            'address2' => null,
            'city' => $this->faker->city(),
            'postal_code' => $this->faker->postcode(),
            'country' => $this->faker->country(),
            'currency' => 'EUR',
            'subtotal_cents' => $subtotal,
            'tax_cents' => $tax,
            'shipping_cents' => $shipping,
            'total_cents' => $subtotal + $tax + $shipping,
        ];
    }

    public function pending(): static
    {
        return $this->state(['status' => 'pending']);
    }

    public function paid(): static
    {
        return $this->state(['status' => 'paid']);
    }

    public function shipped(): static
    {
        return $this->state(['status' => 'shipped']);
    }

    public function cancelled(): static
    {
        return $this->state(['status' => 'cancelled']);
    }
}
