<?php

namespace App\Data;

use App\Enums\CustomerTier;
use App\Models\User;

class PricingContext
{
    /**
     * @param  array<int, array<string, mixed>>  $cartSnapshot
     */
    public function __construct(
        public ?User $user,
        public CustomerTier $tier,
        public array $cartSnapshot = [],
        public int $subtotalCents = 0,
    ) {}

    /**
     * @param  array<int, array<string, mixed>>  $cartSnapshot
     */
    public static function fromUser(?User $user, array $cartSnapshot = [], int $subtotalCents = 0): self
    {
        $tier = $user?->tier instanceof CustomerTier
            ? $user->tier
            : CustomerTier::Bronze;

        return new self(
            user: $user,
            tier: $tier,
            cartSnapshot: $cartSnapshot,
            subtotalCents: $subtotalCents,
        );
    }
}
