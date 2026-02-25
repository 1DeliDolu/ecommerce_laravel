<?php

namespace App\Services\Dashboard;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class AdminAnalyticsService
{
    private const SALES_STATUSES = [
        Order::STATUS_PAID,
        Order::STATUS_SHIPPED,
    ];

    private ?bool $ordersHasTotalCents = null;

    private ?bool $orderItemsHasLineTotalCents = null;

    /**
     * @return array{
     *   categories: list<array{id: int, name: string}>,
     *   defaults: array{scope: string, metric: string, granularity: string, range: string},
     *   options: array{
     *     scopes: list<string>,
     *     metrics: list<string>,
     *     granularities: list<string>,
     *     ranges: list<string>
     *   },
     *   series: list<array{period: string, revenue_cents: int, orders: int, units: int, value: int}>
     * }
     */
    public function bootstrap(CarbonImmutable $now): array
    {
        return Cache::remember($this->bootstrapCacheKey(), now()->addMinutes(10), function () use ($now): array {
            $categories = Category::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
                ->map(fn (Category $category): array => [
                    'id' => (int) $category->id,
                    'name' => (string) $category->name,
                ])
                ->values()
                ->all();

            $defaults = [
                'scope' => 'overall',
                'metric' => 'revenue',
                'granularity' => 'day',
                'range' => '90d',
            ];

            $timeseries = $this->timeseries(
                scope: $defaults['scope'],
                scopeId: null,
                metric: $defaults['metric'],
                granularity: $defaults['granularity'],
                range: $defaults['range'],
                now: $now,
            );

            return [
                'categories' => $categories,
                'defaults' => $defaults,
                'options' => [
                    'scopes' => ['overall', 'category', 'product'],
                    'metrics' => ['revenue', 'units', 'orders'],
                    'granularities' => ['day', 'week', 'month', 'season', 'year'],
                    'ranges' => ['7d', '15d', '30d', '60d', '90d', '180d', '360d'],
                ],
                'series' => $timeseries['series'],
            ];
        });
    }

    /**
     * @return list<array{id: int, name: string}>
     */
    public function productsForCategory(?int $categoryId): array
    {
        $cacheKey = 'admin_analytics:category_products:'.($categoryId ?? 'all');

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use ($categoryId): array {
            $query = Product::query()
                ->select(['products.id', 'products.name'])
                ->when($categoryId !== null, fn ($builder) => $builder->whereHas(
                    'categories',
                    fn ($categoryQuery) => $categoryQuery->whereKey($categoryId),
                ))
                ->orderBy('products.name')
                ->get();

            return $query
                ->map(fn ($product): array => [
                    'id' => (int) $product->id,
                    'name' => (string) $product->name,
                ])
                ->values()
                ->all();
        });
    }

    /**
     * @return array{
     *   filters: array{
     *     scope: string,
     *     scope_id: int|null,
     *     metric: string,
     *     granularity: string,
     *     range: string
     *   },
     *   statuses_included: list<string>,
     *   series: list<array{period: string, revenue_cents: int, orders: int, units: int, value: int}>
     * }
     */
    public function timeseries(
        string $scope,
        ?int $scopeId,
        string $metric,
        string $granularity,
        string $range,
        CarbonImmutable $now,
    ): array {
        $normalizedScope = $this->normalizeScope($scope);
        $normalizedMetric = $this->normalizeMetric($metric);
        $normalizedGranularity = $this->normalizeGranularity($granularity);
        [$normalizedRange, $startAt, $endAt] = $this->resolveRange($range, $now);
        $normalizedScopeId = $normalizedScope === 'overall' ? null : $scopeId;

        $cacheKey = $this->timeseriesCacheKey(
            scope: $normalizedScope,
            scopeId: $normalizedScopeId,
            metric: $normalizedMetric,
            granularity: $normalizedGranularity,
            range: $normalizedRange,
            startAt: $startAt,
            endAt: $endAt,
        );

        return Cache::remember($cacheKey, now()->addMinutes(10), function () use (
            $normalizedScope,
            $normalizedScopeId,
            $normalizedMetric,
            $normalizedGranularity,
            $normalizedRange,
            $startAt,
            $endAt,
        ): array {
            $series = $normalizedScope === 'overall'
                ? $this->overallSeries($normalizedGranularity, $startAt, $endAt)
                : $this->scopedSeries($normalizedScope, $normalizedScopeId, $normalizedGranularity, $startAt, $endAt);

            $series = array_map(function (array $point) use ($normalizedMetric): array {
                $point['value'] = match ($normalizedMetric) {
                    'revenue' => $point['revenue_cents'],
                    'units' => $point['units'],
                    'orders' => $point['orders'],
                    default => $point['revenue_cents'],
                };

                return $point;
            }, $series);

            return [
                'filters' => [
                    'scope' => $normalizedScope,
                    'scope_id' => $normalizedScopeId,
                    'metric' => $normalizedMetric,
                    'granularity' => $normalizedGranularity,
                    'range' => $normalizedRange,
                ],
                'statuses_included' => self::SALES_STATUSES,
                'series' => $series,
            ];
        });
    }

    /**
     * @return list<array{period: string, revenue_cents: int, orders: int, units: int}>
     */
    private function overallSeries(
        string $granularity,
        CarbonImmutable $startAt,
        CarbonImmutable $endAt,
    ): array {
        $periodSql = $this->periodExpression($granularity);
        $start = $startAt->startOfDay();
        $end = $endAt->endOfDay();

        $ordersRevenueExpression = $this->ordersRevenueExpression();
        $ordersRevenueIsCents = $this->ordersRevenueIsCents();

        $orderRows = Order::query()
            ->whereIn('status', self::SALES_STATUSES)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw("{$periodSql} as period")
            ->selectRaw("SUM({$ordersRevenueExpression}) as revenue_total")
            ->selectRaw('COUNT(*) as orders_count')
            ->groupByRaw($periodSql)
            ->orderByRaw($periodSql)
            ->get();

        $unitsByPeriod = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', self::SALES_STATUSES)
            ->whereBetween('orders.created_at', [$start, $end])
            ->selectRaw("{$periodSql} as period")
            ->selectRaw('SUM(order_items.quantity) as units_count')
            ->groupByRaw($periodSql)
            ->pluck('units_count', 'period');

        return $orderRows->map(function ($row) use ($unitsByPeriod, $ordersRevenueIsCents): array {
            $period = (string) ($row->period ?? '');
            $rawRevenue = (string) ($row->revenue_total ?? '0');
            $revenueCents = $ordersRevenueIsCents
                ? (int) round((float) $rawRevenue)
                : $this->toCents($rawRevenue);

            return [
                'period' => $period,
                'revenue_cents' => $revenueCents,
                'orders' => (int) ($row->orders_count ?? 0),
                'units' => (int) ($unitsByPeriod[$period] ?? 0),
            ];
        })->values()->all();
    }

    /**
     * @return list<array{period: string, revenue_cents: int, orders: int, units: int}>
     */
    private function scopedSeries(
        string $scope,
        ?int $scopeId,
        string $granularity,
        CarbonImmutable $startAt,
        CarbonImmutable $endAt,
    ): array {
        $periodSql = $this->periodExpression($granularity);
        $start = $startAt->startOfDay();
        $end = $endAt->endOfDay();

        $orderItemsRevenueExpression = $this->orderItemsRevenueExpression();
        $orderItemsRevenueIsCents = $this->orderItemsRevenueIsCents();

        $query = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->whereIn('orders.status', self::SALES_STATUSES)
            ->whereBetween('orders.created_at', [$start, $end]);

        if ($scope === 'category' && $scopeId !== null) {
            $query->where('products.primary_category_id', $scopeId);
        }

        if ($scope === 'product' && $scopeId !== null) {
            $query->where('order_items.product_id', $scopeId);
        }

        return $query
            ->selectRaw("{$periodSql} as period")
            ->selectRaw("SUM({$orderItemsRevenueExpression}) as revenue_total")
            ->selectRaw('SUM(order_items.quantity) as units_count')
            ->selectRaw('COUNT(DISTINCT orders.id) as orders_count')
            ->groupByRaw($periodSql)
            ->orderByRaw($periodSql)
            ->get()
            ->map(function ($row) use ($orderItemsRevenueIsCents): array {
                $rawRevenue = (string) ($row->revenue_total ?? '0');
                $revenueCents = $orderItemsRevenueIsCents
                    ? (int) round((float) $rawRevenue)
                    : $this->toCents($rawRevenue);

                return [
                    'period' => (string) ($row->period ?? ''),
                    'revenue_cents' => $revenueCents,
                    'orders' => (int) ($row->orders_count ?? 0),
                    'units' => (int) ($row->units_count ?? 0),
                ];
            })
            ->values()
            ->all();
    }

    private function ordersRevenueExpression(): string
    {
        return $this->ordersRevenueIsCents() ? 'orders.total_cents' : 'orders.total';
    }

    private function orderItemsRevenueExpression(): string
    {
        return $this->orderItemsRevenueIsCents() ? 'order_items.line_total_cents' : 'order_items.line_total';
    }

    private function ordersRevenueIsCents(): bool
    {
        if ($this->ordersHasTotalCents === null) {
            $this->ordersHasTotalCents = Schema::hasColumn('orders', 'total_cents');
        }

        return $this->ordersHasTotalCents;
    }

    private function orderItemsRevenueIsCents(): bool
    {
        if ($this->orderItemsHasLineTotalCents === null) {
            $this->orderItemsHasLineTotalCents = Schema::hasColumn('order_items', 'line_total_cents');
        }

        return $this->orderItemsHasLineTotalCents;
    }

    private function bootstrapCacheKey(): string
    {
        $latestCategory = Category::query()->max('updated_at');

        return 'admin_analytics:bootstrap:'.$this->timestampVersion($latestCategory);
    }

    private function timeseriesCacheKey(
        string $scope,
        ?int $scopeId,
        string $metric,
        string $granularity,
        string $range,
        CarbonImmutable $startAt,
        CarbonImmutable $endAt,
    ): string {
        $start = $startAt->startOfDay();
        $end = $endAt->endOfDay();

        $ordersCount = Order::query()
            ->whereIn('status', self::SALES_STATUSES)
            ->whereBetween('created_at', [$start, $end])
            ->count();

        $latestOrderUpdated = Order::query()
            ->whereIn('status', self::SALES_STATUSES)
            ->whereBetween('created_at', [$start, $end])
            ->max('updated_at');

        $itemsQuery = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->leftJoin('products', 'products.id', '=', 'order_items.product_id')
            ->whereIn('orders.status', self::SALES_STATUSES)
            ->whereBetween('orders.created_at', [$start, $end]);

        if ($scope === 'category' && $scopeId !== null) {
            $itemsQuery->where('products.primary_category_id', $scopeId);
        }

        if ($scope === 'product' && $scopeId !== null) {
            $itemsQuery->where('order_items.product_id', $scopeId);
        }

        $latestItemUpdated = $itemsQuery->max('order_items.updated_at');
        $version = $this->maxVersion($latestOrderUpdated, $latestItemUpdated);

        return sprintf(
            'admin_analytics:timeseries:%s:%s:%s:%s:%s:%s:%s',
            $scope,
            $scopeId ?? 'none',
            $metric,
            $granularity,
            $range,
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
            '7d' => ['7d', $now->subDays(6), $now],
            '15d' => ['15d', $now->subDays(14), $now],
            '30d' => ['30d', $now->subDays(29), $now],
            '60d' => ['60d', $now->subDays(59), $now],
            '90d' => ['90d', $now->subDays(89), $now],
            '180d' => ['180d', $now->subDays(179), $now],
            '360d' => ['360d', $now->subDays(359), $now],
            default => ['90d', $now->subDays(89), $now],
        };
    }

    private function normalizeScope(string $scope): string
    {
        return match ($scope) {
            'overall', 'category', 'product' => $scope,
            default => 'overall',
        };
    }

    private function normalizeMetric(string $metric): string
    {
        return match ($metric) {
            'revenue', 'units', 'orders' => $metric,
            default => 'revenue',
        };
    }

    private function normalizeGranularity(string $granularity): string
    {
        return match ($granularity) {
            'day', 'week', 'month', 'season', 'year' => $granularity,
            default => 'day',
        };
    }

    private function periodExpression(string $granularity): string
    {
        $driver = Order::query()->getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            return match ($granularity) {
                'day' => "strftime('%Y-%m-%d', orders.created_at)",
                'week' => "printf('%s-W%02d', strftime('%Y', orders.created_at), CAST(strftime('%W', orders.created_at) AS integer))",
                'month' => "strftime('%Y-%m', orders.created_at)",
                'year' => "strftime('%Y', orders.created_at)",
                'season' => "printf('%s-Q%d', strftime('%Y', orders.created_at), CAST(((CAST(strftime('%m', orders.created_at) AS integer) - 1) / 3) + 1 AS integer))",
                default => "strftime('%Y-%m', orders.created_at)",
            };
        }

        return match ($granularity) {
            'day' => "DATE_FORMAT(orders.created_at, '%Y-%m-%d')",
            'week' => "DATE_FORMAT(orders.created_at, '%x-W%v')",
            'month' => "DATE_FORMAT(orders.created_at, '%Y-%m')",
            'year' => "DATE_FORMAT(orders.created_at, '%Y')",
            'season' => "CONCAT(YEAR(orders.created_at), '-Q', QUARTER(orders.created_at))",
            default => "DATE_FORMAT(orders.created_at, '%Y-%m')",
        };
    }

    private function timestampVersion(mixed $value): string
    {
        if ($value === null) {
            return 'none';
        }

        return CarbonImmutable::parse($value)->format('YmdHis');
    }

    private function maxVersion(mixed $first, mixed $second): string
    {
        $versions = array_filter([
            $this->timestampVersion($first),
            $this->timestampVersion($second),
        ], static fn (string $version): bool => $version !== 'none');

        if ($versions === []) {
            return 'none';
        }

        rsort($versions);

        return $versions[0];
    }

    private function toCents(string $amount): int
    {
        return (int) round(((float) $amount) * 100);
    }
}
