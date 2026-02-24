<?php

namespace Database\Factories;

use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PaymentMethod>
 */
class PaymentMethodFactory extends Factory
{
    protected $model = PaymentMethod::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => $this->faker->randomElement(['Primary', 'Business', 'Travel']),
            'card_holder_name' => $this->faker->name(),
            'brand' => $this->faker->randomElement(['Visa', 'Mastercard', 'Amex']),
            'last_four' => str_pad((string) $this->faker->numberBetween(0, 9999), 4, '0', STR_PAD_LEFT),
            'expiry_month' => $this->faker->numberBetween(1, 12),
            'expiry_year' => now()->year + $this->faker->numberBetween(1, 8),
            'is_default' => false,
        ];
    }

    public function asDefault(): static
    {
        return $this->state(fn (): array => ['is_default' => true]);
    }
}
