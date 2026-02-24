<?php

namespace Database\Factories;

use App\Enums\CustomerTier;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $roll = fake()->numberBetween(1, 100);
        $tier = match (true) {
            $roll <= 5 => CustomerTier::Platinum,
            $roll <= 20 => CustomerTier::Gold,
            $roll <= 50 => CustomerTier::Silver,
            default => CustomerTier::Bronze,
        };

        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'tier' => $tier->value,
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Indicate that the model has two-factor authentication configured.
     */
    public function withTwoFactor(): static
    {
        return $this->state(fn (array $attributes) => [
            'two_factor_secret' => encrypt('secret'),
            'two_factor_recovery_codes' => encrypt(json_encode(['recovery-code-1'])),
            'two_factor_confirmed_at' => now(),
        ]);
    }

    public function platinum(): static
    {
        return $this->state(fn (): array => [
            'tier' => CustomerTier::Platinum->value,
        ]);
    }

    public function gold(): static
    {
        return $this->state(fn (): array => [
            'tier' => CustomerTier::Gold->value,
        ]);
    }

    public function silver(): static
    {
        return $this->state(fn (): array => [
            'tier' => CustomerTier::Silver->value,
        ]);
    }

    public function bronze(): static
    {
        return $this->state(fn (): array => [
            'tier' => CustomerTier::Bronze->value,
        ]);
    }
}
