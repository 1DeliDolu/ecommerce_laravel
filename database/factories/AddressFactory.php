<?php

namespace Database\Factories;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Address>
 */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => $this->faker->randomElement(['Home', 'Office', 'Delivery']),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'phone' => $this->faker->optional(0.7)->phoneNumber(),
            'line1' => $this->faker->streetAddress(),
            'line2' => $this->faker->optional(0.2)->secondaryAddress(),
            'city' => $this->faker->city(),
            'state' => $this->faker->optional(0.8)->state(),
            'postal_code' => $this->faker->postcode(),
            'country' => $this->faker->country(),
            'is_default' => false,
        ];
    }

    public function asDefault(): static
    {
        return $this->state(fn (): array => ['is_default' => true]);
    }
}
