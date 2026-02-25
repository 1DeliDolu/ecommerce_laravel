<<<<<<< Updated upstream
import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
=======
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
>>>>>>> Stashed changes
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

<<<<<<< Updated upstream
=======
// ─── Types ────────────────────────────────────────────────────────────────────

type Kpis = {
    revenue_cents: number;
    orders: number;
    units: number;
    aov_cents: number;
};

type RevenuePoint = {
    period: string;
    revenue_cents: number;
    orders: number;
    units: number;
};

type ProductRow = {
    product_id: number | null;
    name: string;
    units: number;
    revenue_cents: number;
};

type CategoryPoint = {
    period: string;
    categories: Record<string, number>;
};

type Category = {
    id: number;
    name: string;
};

type Stats = {
    kpis: Kpis;
    revenue_over_time: RevenuePoint[];
    top_products: ProductRow[];
    category_performance: CategoryPoint[];
    category_drilldown: ProductRow[];
};

type Filters = {
    range: string;
    granularity: string;
    category_id: number | null;
};

type Props = {
    stats: Stats;
    filters: Filters;
    categories: Category[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function formatRevenueTick(value: number): string {
    if (value >= 100_000) return `$${(value / 100_000).toFixed(1)}k`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
    return `$${value}`;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'last_90_days', label: 'Last 90 days' },
    { value: 'ytd', label: 'Year to date' },
    { value: 'last_12_months', label: 'Last 12 months' },
];

const GRANULARITY_OPTIONS = [
    { value: 'day', label: 'Daily' },
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' },
    { value: 'season', label: 'By quarter' },
];

const CATEGORY_COLORS = [
    '#6366f1',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#14b8a6',
    '#f97316',
    '#0ea5e9',
    '#84cc16',
    '#e11d48',
    '#a855f7',
    '#06b6d4',
    '#d97706',
    '#22c55e',
    '#f43f5e',
    '#3b82f6',
    '#eab308',
    '#64748b',
    '#c026d3',
    '#0891b2',
    '#16a34a',
    '#dc2626',
    '#7c3aed',
    '#0284c7',
    '#ca8a04',
    '#15803d',
    '#b91c1c',
    '#6d28d9',
    '#0369a1',
];

>>>>>>> Stashed changes
const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

<<<<<<< Updated upstream
export default function Dashboard() {
=======
// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
    title,
    value,
    sub,
}: {
    title: string;
    value: string;
    sub?: string;
}) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-bold">{value}</p>
                {sub && (
                    <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                )}
            </CardContent>
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard({ stats, filters, categories }: Props) {
    const {
        kpis,
        revenue_over_time,
        top_products,
        category_performance,
        category_drilldown,
    } = stats;

    // All derived category names from the performance data
    const categoryNames = Array.from(
        new Set(category_performance.flatMap((p) => Object.keys(p.categories))),
    ).sort();

    const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(
        new Set(),
    );

    function toggleCategory(name: string) {
        setHiddenCategories((prev) => {
            const next = new Set(prev);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            return next;
        });
    }

    function applyFilter(patch: Partial<Filters>) {
        router.get(
            dashboard().url,
            {
                ...filters,
                ...patch,
                category_id:
                    patch.category_id ?? filters.category_id ?? undefined,
            },
            { preserveScroll: true, replace: true },
        );
    }

    const selectedCategory =
        categories.find((c) => c.id === filters.category_id) ?? null;

    const isEmpty = revenue_over_time.length === 0;

>>>>>>> Stashed changes
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
<<<<<<< Updated upstream
=======

                {isEmpty ? (
                    <Card>
                        <CardContent className="flex h-48 items-center justify-center">
                            <p className="text-sm text-muted-foreground">
                                No revenue data for this period.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* ── Revenue over time ──────────────────────────── */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue over time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={280}>
                                    <AreaChart
                                        data={revenue_over_time}
                                        margin={{
                                            top: 4,
                                            right: 16,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient
                                                id="colorRevenue"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#6366f1"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#6366f1"
                                                    stopOpacity={0}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e5e7eb"
                                        />
                                        <XAxis
                                            dataKey="period"
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis
                                            tickFormatter={formatRevenueTick}
                                            tick={{ fontSize: 12 }}
                                            tickLine={false}
                                            axisLine={false}
                                            width={60}
                                        />
                                        <Tooltip
                                            formatter={(value: number) => [
                                                formatCurrency(value),
                                                'Revenue',
                                            ]}
                                            contentStyle={{ fontSize: 13 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue_cents"
                                            stroke="#6366f1"
                                            strokeWidth={2}
                                            fill="url(#colorRevenue)"
                                            name="Revenue"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* ── Category performance ───────────────────────── */}
                        {categoryNames.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Revenue by category</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer
                                        width="100%"
                                        height={300}
                                    >
                                        <BarChart
                                            data={category_performance.map(
                                                (p) => ({
                                                    period: p.period,
                                                    ...p.categories,
                                                }),
                                            )}
                                            margin={{
                                                top: 4,
                                                right: 16,
                                                left: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#e5e7eb"
                                            />
                                            <XAxis
                                                dataKey="period"
                                                tick={{ fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                tickFormatter={
                                                    formatRevenueTick
                                                }
                                                tick={{ fontSize: 12 }}
                                                tickLine={false}
                                                axisLine={false}
                                                width={60}
                                            />
                                            <Tooltip
                                                formatter={(
                                                    value: number,
                                                    name: string,
                                                ) => [
                                                    formatCurrency(value),
                                                    name,
                                                ]}
                                                contentStyle={{ fontSize: 13 }}
                                            />
                                            {categoryNames.map((name, i) => (
                                                <Bar
                                                    key={name}
                                                    dataKey={name}
                                                    stackId="a"
                                                    fill={
                                                        CATEGORY_COLORS[
                                                            i %
                                                                CATEGORY_COLORS.length
                                                        ]
                                                    }
                                                    hide={hiddenCategories.has(
                                                        name,
                                                    )}
                                                />
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>

                                    {/* Interactive legend */}
                                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                                        {categoryNames.map((name, i) => {
                                            const hidden =
                                                hiddenCategories.has(name);
                                            return (
                                                <button
                                                    key={name}
                                                    type="button"
                                                    onClick={() =>
                                                        toggleCategory(name)
                                                    }
                                                    className={`flex cursor-pointer items-center gap-1.5 text-sm transition-opacity ${
                                                        hidden
                                                            ? 'opacity-35'
                                                            : 'opacity-100'
                                                    }`}
                                                >
                                                    <span
                                                        className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border-2"
                                                        style={{
                                                            backgroundColor:
                                                                hidden
                                                                    ? 'transparent'
                                                                    : CATEGORY_COLORS[
                                                                          i %
                                                                              CATEGORY_COLORS.length
                                                                      ],
                                                            borderColor:
                                                                CATEGORY_COLORS[
                                                                    i %
                                                                        CATEGORY_COLORS.length
                                                                ],
                                                        }}
                                                    >
                                                        {!hidden && (
                                                            <svg
                                                                viewBox="0 0 10 10"
                                                                className="h-2.5 w-2.5"
                                                                fill="none"
                                                            >
                                                                <path
                                                                    d="M2 5l2.5 2.5L8 3"
                                                                    stroke="white"
                                                                    strokeWidth="1.5"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        )}
                                                    </span>
                                                    <span>{name}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ── Top products + Drilldown ───────────────────── */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {/* Top products */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Top 10 products</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="px-6 py-3 text-left font-medium">
                                                    Product
                                                </th>
                                                <th className="px-6 py-3 text-right font-medium">
                                                    Units
                                                </th>
                                                <th className="px-6 py-3 text-right font-medium">
                                                    Revenue
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {top_products.map((p) => (
                                                <tr
                                                    key={p.product_id ?? p.name}
                                                    className="border-b last:border-0"
                                                >
                                                    <td className="px-6 py-3">
                                                        {p.name}
                                                    </td>
                                                    <td className="px-6 py-3 text-right tabular-nums">
                                                        {p.units}
                                                    </td>
                                                    <td className="px-6 py-3 text-right tabular-nums">
                                                        {formatCurrency(
                                                            p.revenue_cents,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {top_products.length === 0 && (
                                                <tr>
                                                    <td
                                                        colSpan={3}
                                                        className="px-6 py-6 text-center text-muted-foreground"
                                                    >
                                                        No product data.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>

                            {/* Category drilldown */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>
                                        {selectedCategory
                                            ? `${selectedCategory.name} — products`
                                            : 'Category drilldown'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {!selectedCategory ? (
                                        <p className="px-6 py-6 text-sm text-muted-foreground">
                                            Select a category above to see a
                                            product breakdown.
                                        </p>
                                    ) : category_drilldown.length === 0 ? (
                                        <p className="px-6 py-6 text-sm text-muted-foreground">
                                            No sales found for this category in
                                            the selected period.
                                        </p>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="px-6 py-3 text-left font-medium">
                                                        Product
                                                    </th>
                                                    <th className="px-6 py-3 text-right font-medium">
                                                        Units
                                                    </th>
                                                    <th className="px-6 py-3 text-right font-medium">
                                                        Revenue
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {category_drilldown.map((p) => (
                                                    <tr
                                                        key={
                                                            p.product_id ??
                                                            p.name
                                                        }
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="px-6 py-3">
                                                            {p.name}
                                                        </td>
                                                        <td className="px-6 py-3 text-right tabular-nums">
                                                            {p.units}
                                                        </td>
                                                        <td className="px-6 py-3 text-right tabular-nums">
                                                            {formatCurrency(
                                                                p.revenue_cents,
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
>>>>>>> Stashed changes
            </div>
        </AppLayout>
    );
}
