import { Badge } from '@/components/ui/badge';

type Tier = 'platinum' | 'gold' | 'silver' | 'bronze';

function normalizeTier(tier: unknown): Tier {
    if (tier === 'platinum') return 'platinum';
    if (tier === 'gold') return 'gold';
    if (tier === 'silver') return 'silver';

    return 'bronze';
}

function tierLabel(tier: Tier): string {
    if (tier === 'platinum') return 'Platinum';
    if (tier === 'gold') return 'Gold';
    if (tier === 'silver') return 'Silver';

    return 'Bronze';
}

function tierClasses(tier: Tier): string {
    if (tier === 'platinum') return 'border-cyan-300 bg-cyan-500/10 text-cyan-700';
    if (tier === 'gold') return 'border-amber-300 bg-amber-500/10 text-amber-700';
    if (tier === 'silver') return 'border-slate-300 bg-slate-500/10 text-slate-700';

    return 'border-orange-300 bg-orange-500/10 text-orange-700';
}

export default function TierBadge({ tier }: { tier: unknown }) {
    const normalizedTier = normalizeTier(tier);

    return (
        <Badge
            variant="outline"
            className={tierClasses(normalizedTier)}
            data-test="tier-badge"
        >
            {tierLabel(normalizedTier)}
        </Badge>
    );
}

