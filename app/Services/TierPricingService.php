<?php

namespace App\Services;

use App\Enums\CustomerTier;

/**
 * Central hook for all tier-based pricing logic.
 *
 * Currently every method returns 0 / false (no active discounts).
 * When benefits are introduced, implement the logic here — the rest of the
 * application already calls this service, so changes propagate automatically.
 */
class TierPricingService
{
    /**
     * Discount rate (0.0 – 1.0) for the given context.
     * Example: 0.10 = 10 % off subtotal.
     */
    public function discountRate(PricingContext $ctx): float
    {
        return match ($ctx->tier) {
            CustomerTier::Platinum => 0.0, // future: 0.15
            CustomerTier::Gold => 0.0,     // future: 0.10
            CustomerTier::Silver => 0.0,   // future: 0.05
            CustomerTier::Bronze => 0.0,
        };
    }

    /**
     * Discount amount in cents derived from the context subtotal.
     */
    public function discountCents(PricingContext $ctx, int $subtotalCents): int
    {
        return (int) round($subtotalCents * $this->discountRate($ctx));
    }

    /**
     * Whether free shipping applies for this tier + subtotal.
     */
    public function hasFreeShipping(PricingContext $ctx, int $subtotalCents): bool
    {
        return false; // future: platinum >= 5000 cents → free
    }
}
