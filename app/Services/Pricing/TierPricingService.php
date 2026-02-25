<?php

namespace App\Services\Pricing;

use App\Data\PricingContext;
use App\Enums\CustomerTier;
use App\Models\User;

class TierPricingService
{
    public function discountRateFor(User|CustomerTier|null $subject): float
    {
        $tier = $subject instanceof User
            ? ($subject->tier instanceof CustomerTier ? $subject->tier : CustomerTier::Bronze)
            : ($subject ?? CustomerTier::Bronze);

        return match ($tier) {
            CustomerTier::Platinum => 0.0,
            CustomerTier::Gold => 0.0,
            CustomerTier::Silver => 0.0,
            CustomerTier::Bronze => 0.0,
        };
    }

    /**
     * @return array{discount_rate: float, discount_cents: int, adjusted_subtotal_cents: int}
     */
    public function evaluate(PricingContext $context): array
    {
        $discountRate = $this->discountRateFor($context->tier);
        $discountCents = (int) round($context->subtotalCents * $discountRate);
        $adjustedSubtotalCents = max(0, $context->subtotalCents - $discountCents);

        return [
            'discount_rate' => $discountRate,
            'discount_cents' => $discountCents,
            'adjusted_subtotal_cents' => $adjustedSubtotalCents,
        ];
    }
}
