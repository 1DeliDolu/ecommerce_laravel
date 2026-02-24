<?php

namespace App\Services\Dashboard;

use App\Models\Order;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;

class AdminDashboardMetricsService
{
    private const SALES_STATUSES = [
        Order::STATUS_PAID,
        Order::STATUS_SHIPPED,
    ];

    /**
     * @return array{
     *   filters: array{range: string, granularity: string},
     *   statuses_included: list<string>,
     *   kpis: array{revenue_cents: int, orders: int, units: int, aov_cents: int},
     *   revenue_over_time: list<array{period: string, revenue_cents: int, orders: int, units: int}>,
     *   top_products: list<array{product_id: int|null, name: string, units: int, revenue_cents: int}>,
     *   category_performance: list<array{period: string, categories: array<string, int>}>,
     *   category_drilldown: list<array{category: string, units: int, revenue_cents: int, products: list<array{product_id: int|null, name: string, units: int, revenue_cents: int}>}>
     * }
     */
    public function build(string $range, string $granularity, CarbonImmutable $now): array
    {
        [$normalizedRange, $startAt, $endAt] = $this->resolveRange($range, $now);
        $normalizedGranularity = $this->normalizeGranularity($granularity);

        $cacheKey = $this->cacheKey(
            range: $normalizedRange,
            granularity: $normalizedGranularity,
            startAt: $startAt,
            endAt: $endAt,
        );

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use (
            $normalizedRange,
            $normalizedGranularity,
            $startAt,
            $endAt,
        ): array {
            return $this->buildFresh(
                normalizedRange: $normalizedRange,
                normalizedGranularity: $normalizedGranularity,
                startAt: $startAt,
                endAt: $endAt,
            );
        });
    }

    /**
     * @return array{
     *   filters: array{range: string, granularity: string},
     *   statuses_included: list<string>,
     *   kpis: array{revenue_cents: int, orders: int, units: int, aov_cents: int},
     *   revenue_over_time: list<array{period: string, revenue_cents: int, orders: int, units: int}>,
     *   top_products: list<array{product_id: int|null, name: string, units: int, revenue_cents: int}>,
     *   category_performance: list<array{period: string, categories: array<string, int>}>,
     *   category_drilldown: list<array{category: string, units: int, revenue_cents: int, products: list<array{product_id: int|null, name: string, units: int, revenue_cents: int}>}>
     * }
     */
    private function buildFresh(
        string $normalizedRange,
        string $normalizedGranularity,
        CarbonImmutable $startAt,
        CarbonImmutable $endAt,
    ): array {
        $orders = Order::query()
            ->whereIn('status', self::SALES_STATUSES)
            ->whereBetween('created_at', [$startAt->startOfDay(), $endAt->endOfDay()])
            ->with([
                'items.product.primaryCategory:id,name',
            ])
            ->get();

        $revenueOverTime = [];
        $topProducts = [];
        $categoryPerformance = [];
        $categoryDrilldown = [];

        $totalRevenueCents = 0;
        $totalUnits = 0;
        $totalOrders = $orders->count();

        foreach ($orders as $order) {
            $period = $this->periodLabel(
                at: CarbonImmutable::parse($order->created_at),
                granularity: $normalizedGranularity,
            );
            $orderRevenueCents = $this->toCents((string) $order->total);
            $orderUnits = (int) $order->items->sum('quantity');

            $totalRevenueCents += $orderRevenueCents;
            $totalUnits += $orderUnits;

            $revenueOverTime[$period] ??= [
                'period' => $period,
                'revenue_cents' => 0,
                'orders' => 0,
                'units' => 0,
            ];

            $revenueOverTime[$period]['revenue_cents'] += $orderRevenueCents;
            $revenueOverTime[$period]['orders'] += 1;
            $revenueOverTime[$period]['units'] += $orderUnits;

            foreach ($order->items as $item) {
                $itemRevenueCents = $this->toCents((string) $item->line_total);
                $productId = $item->product_id !== null ? (int) $item->product_id : null;
                $productName = (string) $item->product_name;
                $productKey = $productId !== null
                    ? 'product-'.$productId
                    : 'name-'.$productName;

                $topProducts[$productKey] ??= [
                    'product_id' => $productId,
                    'name' => $productName,
                    'units' => 0,
                    'revenue_cents' => 0,
                ];

                $topProducts[$productKey]['units'] += (int) $item->quantity;
                $topProducts[$productKey]['revenue_cents'] += $itemRevenueCents;

                $categoryName = $item->product?->primaryCategory?->name ?? 'Uncategorized';
                $categoryPerformance[$period] ??= [];
                $categoryPerformance[$period][$categoryName] =
                    ($categoryPerformance[$period][$categoryName] ?? 0) + $itemRevenueCents;

                $categoryDrilldown[$categoryName] ??= [
                    'category' => $categoryName,
                    'units' => 0,
                    'revenue_cents' => 0,
                    'products' => [],
                ];

                $categoryDrilldown[$categoryName]['units'] += (int) $item->quantity;
                $categoryDrilldown[$categoryName]['revenue_cents'] += $itemRevenueCents;
                $categoryDrilldown[$categoryName]['products'][$productKey] ??= [
                    'product_id' => $productId,
                    'name' => $productName,
                    'units' => 0,
                    'revenue_cents' => 0,
                ];
                $categoryDrilldown[$categoryName]['products'][$productKey]['units'] += (int) $item->quantity;
                $categoryDrilldown[$categoryName]['products'][$productKey]['revenue_cents'] += $itemRevenueCents;
            }
        }

        $timeline = collect($revenueOverTime)
            ->sortKeys()
            ->values()
            ->all();

        $topProductsList = collect($topProducts)
            ->sortByDesc(fn (array $row): int => $row['revenue_cents'])
            ->values()
            ->take(10)
            ->all();

        $categoryPerformanceList = collect($categoryPerformance)
            ->sortKeys()
            ->map(fn (array $categories, string $period): array => [
                'period' => $period,
                'categories' => $categories,
            ])
            ->values()
            ->all();

        $categoryDrilldownList = collect($categoryDrilldown)
            ->map(function (array $row): array {
                $products = collect($row['products'])
                    ->sortByDesc(fn (array $product): int => $product['revenue_cents'])
                    ->values()
                    ->take(10)
                    ->all();

                return [
                    'category' => $row['category'],
                    'units' => $row['units'],
                    'revenue_cents' => $row['revenue_cents'],
                    'products' => $products,
                ];
            })
            ->sortByDesc(fn (array $row): int => $row['revenue_cents'])
            ->values()
            ->all();

        return [
            'filters' => [
                'range' => $normalizedRange,
                'granularity' => $normalizedGranularity,
            ],
            'statuses_included' => self::SALES_STATUSES,
            'kpis' => [
                'revenue_cents' => $totalRevenueCents,
                'orders' => $totalOrders,
                'units' => $totalUnits,
                'aov_cents' => $totalOrders > 0 ? (int) floor($totalRevenueCents / $totalOrders) : 0,
            ],
            'revenue_over_time' => $timeline,
            'top_products' => $topProductsList,
            'category_performance' => $categoryPerformanceList,
            'category_drilldown' => $categoryDrilldownList,
        ];
    }

    private function cacheKey(
        string $range,
        string $granularity,
        CarbonImmutable $startAt,
        CarbonImmutable $endAt,
    ): string {
        $baseQuery = Order::query()
            ->whereIn('status', self::SALES_STATUSES)
            ->whereBetween('created_at', [$startAt->startOfDay(), $endAt->endOfDay()]);

        $latestUpdatedAt = (clone $baseQuery)->max('updated_at');
        $ordersCount = (clone $baseQuery)->count();
        $version = $latestUpdatedAt !== null
            ? CarbonImmutable::parse($latestUpdatedAt)->format('YmdHis')
            : 'none';

        return sprintf(
            'admin_dashboard_metrics:%s:%s:%s:%s',
            $range,
            $granularity,
            $ordersCount,
            $version,
        );
    }

    /**
     * @return array{0: string, 1: CarbonImmutable, 2: CarbonImmutable}
     */
    private function resolveRange(string $range, CarbonImmutable $now): array
    {
        return match ($range) {
            '30d' => ['30d', $now->subDays(29), $now],
            '90d' => ['90d', $now->subDays(89), $now],
            '12m' => ['12m', $now->subMonths(11)->startOfMonth(), $now],
            'ytd' => ['ytd', $now->startOfYear(), $now],
            default => ['90d', $now->subDays(89), $now],
        };
    }

    private function normalizeGranularity(string $granularity): string
    {
        return match ($granularity) {
            'day', 'month', 'year', 'season' => $granularity,
            default => 'month',
        };
    }

    private function periodLabel(CarbonImmutable $at, string $granularity): string
    {
        return match ($granularity) {
            'day' => $at->format('Y-m-d'),
            'month' => $at->format('Y-m'),
            'year' => $at->format('Y'),
            'season' => sprintf('%s-Q%s', $at->format('Y'), $at->quarter),
            default => $at->format('Y-m'),
        };
    }

    private function toCents(string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }
}
