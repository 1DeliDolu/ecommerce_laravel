<?php

namespace App\Enums;

enum CustomerTier: string
{
    case Platinum = 'platinum';
    case Gold = 'gold';
    case Silver = 'silver';
    case Bronze = 'bronze';

    public function label(): string
    {
        return match ($this) {
            self::Platinum => 'Platinum',
            self::Gold => 'Gold',
            self::Silver => 'Silver',
            self::Bronze => 'Bronze',
        };
    }

    /**
     * CSS colour classes for the tier badge (Tailwind).
     */
    public function badgeClasses(): string
    {
        return match ($this) {
            self::Platinum => 'bg-slate-200 text-slate-800',
            self::Gold => 'bg-yellow-100 text-yellow-800',
            self::Silver => 'bg-gray-100 text-gray-700',
            self::Bronze => 'bg-orange-100 text-orange-800',
        };
    }
}
