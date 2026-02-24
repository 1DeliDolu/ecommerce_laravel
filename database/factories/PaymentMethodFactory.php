<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $brands = ['visa', 'mastercard', 'amex', 'discover'];

        return [
            'user_id' => \App\Models\User::factory(),
            'brand' => fake()->randomElement($brands),
            'last4' => (string) fake()->numerify('####'),
            'cardholder_name' => fake()->name(),
            'exp_month' => fake()->numberBetween(1, 12),
            'exp_year' => fake()->numberBetween(2025, 2030),
            'is_default' => false,
        ];
    }
}
