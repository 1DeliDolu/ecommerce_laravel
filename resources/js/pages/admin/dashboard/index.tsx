import { Head, Link } from '@inertiajs/react';
import ChartBuilder from '@/components/admin/charts/chart-builder';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

type Props = {
    metrics: {
        statuses_included: string[];
        kpis: {
            revenue_cents: number;
            orders: number;
            units: number;
            aov_cents: number;
        };
    };
    pricing_preview: {
        discount_rate: number;
        discount_cents: number;
        adjusted_subtotal_cents: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
];

function formatMoney(cents: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(cents / 100);
}

export default function AdminDashboardIndex({ metrics, pricing_preview }: Props) {
    const kpiCards = [
        {
            label: 'Revenue',
            value: formatMoney(metrics.kpis.revenue_cents),
        },
        {
            label: 'Orders',
            value: metrics.kpis.orders.toString(),
        },
        {
            label: 'Units Sold',
            value: metrics.kpis.units.toString(),
        },
        {
            label: 'AOV',
            value: formatMoney(metrics.kpis.aov_cents),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Admin Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Revenue is calculated from{' '}
                        {metrics.statuses_included.join(', ')} orders.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {kpiCards.map((card) => (
                        <section
                            key={card.label}
                            className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-5 shadow-sm shadow-black/5"
                        >
                            <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-primary/15 blur-2xl" />
                            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground/90 uppercase">
                                {card.label}
                            </p>
                            <p className="mt-3 text-3xl font-semibold tracking-tight">
                                {card.value}
                            </p>
                        </section>
                    ))}
                </div>

                <ChartBuilder />

                <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-5 shadow-sm shadow-black/5">
                    <div className="pointer-events-none absolute -right-14 top-0 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
                    <h2 className="mb-3 text-sm font-semibold tracking-wide">
                        Tier Pricing Hook (Preview)
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Pricing hook is active and currently returns neutral
                        discount rates.
                    </p>
                    <div className="mt-4 space-y-2 rounded-xl border border-border/70 bg-background/55 p-3 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                Discount rate
                            </span>
                            <span>
                                {(pricing_preview.discount_rate * 100).toFixed(2)}%
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                Discount amount
                            </span>
                            <span>{formatMoney(pricing_preview.discount_cents)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                                Adjusted subtotal
                            </span>
                            <span>
                                {formatMoney(pricing_preview.adjusted_subtotal_cents)}
                            </span>
                        </div>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                        This preview uses a sample subtotal of $100.00.
                    </p>
                </section>

                <div className="text-xs text-muted-foreground">
                    Non-admin users continue to see the standard dashboard at{' '}
                    <Link href={dashboard()} className="underline">
                        /dashboard
                    </Link>
                    .
                </div>
            </div>
        </AppLayout>
    );
}
