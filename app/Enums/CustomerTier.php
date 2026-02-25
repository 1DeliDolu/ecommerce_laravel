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
}
