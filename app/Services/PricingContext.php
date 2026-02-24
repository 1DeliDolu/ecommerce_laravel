<?php

namespace App\Services;

use App\Enums\CustomerTier;
use App\Models\User;

/**
 * Snapshot of the pricing context at the time of a calculation.
 * Passed into TierPricingService so all pricing decisions share one object.
 */
class PricingContext
{
    public readonly CustomerTier $tier;

    public function __construct(
        public readonly ?User $user,
        /** @var array<int, array{product_id:int, qty:int, unit_price_cents:int}> */
        public readonly array $cartItems = [],
    ) {
        $this->tier = $user?->tier ?? CustomerTier::Bronze;
    }
}
