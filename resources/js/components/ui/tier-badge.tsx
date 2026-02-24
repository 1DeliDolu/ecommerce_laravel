const TIER_STYLES: Record<string, { label: string; className: string }> = {
    platinum: {
        label: 'Platinum',
        className: 'bg-slate-200 text-slate-800 border border-slate-300',
    },
    gold: {
        label: 'Gold',
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    },
    silver: {
        label: 'Silver',
        className: 'bg-gray-100 text-gray-700 border border-gray-200',
    },
    bronze: {
        label: 'Bronze',
        className: 'bg-orange-100 text-orange-800 border border-orange-200',
    },
};

interface TierBadgeProps {
    tier: string;
    className?: string;
}

export function TierBadge({ tier, className = '' }: TierBadgeProps) {
    const config = TIER_STYLES[tier.toLowerCase()] ?? TIER_STYLES['bronze'];

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className} ${className}`}
        >
            {config.label}
        </span>
    );
}
