<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\CarbonInterface;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /** Statuses that count as revenue (Faz-D0). */
    private const REVENUE_STATUSES = ['paid', 'shipped'];

    public function index(Request $request): Response
    {
        $range = $request->query('range', 'last_12_months');
        $granularity = $request->query('granularity', 'month');
        $categoryId = $request->query('category_id');

        [$from, $to] = $this->dateRange($range);

        $cacheKey = "dashboard:{$range}:{$granularity}:".($categoryId ?? 'all');

        $data = Cache::remember($cacheKey, now()->addMinutes(10), function () use ($from, $to, $granularity, $categoryId) {
            $catId = $categoryId ? (int) $categoryId : null;

            return [
                'kpis' => $this->kpis($from, $to, $catId),
                'revenue_over_time' => $this->revenueOverTime($from, $to, $granularity, $catId),
                'top_products' => $this->topProducts($from, $to, $catId),
                'category_performance' => $this->categoryPerformance($from, $to, $granularity),
                'category_drilldown' => $catId ? $this->categoryDrilldown($catId, $from, $to) : [],
            ];
        });

        return Inertia::render('dashboard', [
            'stats' => $data,
            'filters' => [
                'range' => $range,
                'granularity' => $granularity,
                'category_id' => $categoryId ? (int) $categoryId : null,
            ],
            'categories' => Category::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get(),
        ]);
    }

    // -------------------------------------------------------------------------
    // KPI cards
    // -------------------------------------------------------------------------

    /**
     * @return array{revenue_cents:int, orders:int, units:int, aov_cents:int}
     */
    private function kpis(CarbonInterface $from, CarbonInterface $to, ?int $categoryId = null): array
    {
        $orderIds = $this->orderIdsForCategory($from, $to, $categoryId);

        $row = Order::query()
            ->whereIn('status', self::REVENUE_STATUSES)
            ->whereBetween('created_at', [$from, $to])
            ->when($orderIds !== null, fn ($q) => $q->whereIn('id', $orderIds))
            ->selectRaw('
                COUNT(*) as orders,
                COALESCE(SUM(total_cents), 0) as revenue_cents,
                COALESCE(SUM(total_cents) / NULLIF(COUNT(*), 0), 0) as aov_cents
            ')
            ->first();

        $units = (int) OrderItem::query()
            ->whereHas('order', fn ($q) => $q
                ->whereIn('status', self::REVENUE_STATUSES)
                ->whereBetween('created_at', [$from, $to])
                ->when($orderIds !== null, fn ($q2) => $q2->whereIn('id', $orderIds))
            )
            ->when($categoryId !== null, fn ($q) => $q
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->where('products.primary_category_id', $categoryId)
            )
            ->sum('quantity');

        return [
            'revenue_cents' => (int) $row->revenue_cents,
            'orders' => (int) $row->orders,
            'units' => $units,
            'aov_cents' => (int) $row->aov_cents,
        ];
    }

    // -------------------------------------------------------------------------
    // Revenue over time
    // -------------------------------------------------------------------------

    /**
     * @return list<array{period:string, revenue_cents:int, orders:int, units:int}>
     */
    private function revenueOverTime(CarbonInterface $from, CarbonInterface $to, string $granularity, ?int $categoryId = null): array
    {
        $periodExpr = $this->periodExpression($granularity);
        $orderIds = $this->orderIdsForCategory($from, $to, $categoryId);

        $rows = Order::query()
            ->whereIn('status', self::REVENUE_STATUSES)
            ->whereBetween('created_at', [$from, $to])
            ->when($orderIds !== null, fn ($q) => $q->whereIn('id', $orderIds))
            ->selectRaw("
                {$periodExpr} as period,
                COUNT(*) as orders,
                COALESCE(SUM(total_cents), 0) as revenue_cents
            ")
            ->groupByRaw($periodExpr)
            ->orderByRaw($periodExpr)
            ->get();

        // Attach units per period
        $unitsByPeriod = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', self::REVENUE_STATUSES)
            ->whereBetween('orders.created_at', [$from, $to])
            ->when($orderIds !== null, fn ($q) => $q->whereIn('orders.id', $orderIds))
            ->when($categoryId !== null, fn ($q) => $q
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->where('products.primary_category_id', $categoryId)
            )
            ->selectRaw("{$periodExpr} as period, COALESCE(SUM(order_items.quantity), 0) as units")
            ->groupByRaw($periodExpr)
            ->pluck('units', 'period');

        return $rows->map(fn ($r) => [
            'period' => $r->period,
            'revenue_cents' => (int) $r->revenue_cents,
            'orders' => (int) $r->orders,
            'units' => (int) ($unitsByPeriod[$r->period] ?? 0),
        ])->values()->all();
    }

    // -------------------------------------------------------------------------
    // Top products
    // -------------------------------------------------------------------------

    /**
     * @return list<array{product_id:int|null, name:string, units:int, revenue_cents:int}>
     */
    private function topProducts(CarbonInterface $from, CarbonInterface $to, ?int $categoryId = null, int $limit = 10): array
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereIn('orders.status', self::REVENUE_STATUSES)
            ->whereBetween('orders.created_at', [$from, $to])
            ->when($categoryId !== null, fn ($q) => $q
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->where('products.primary_category_id', $categoryId)
            )
            ->selectRaw('
                order_items.product_id,
                order_items.product_name as name,
                COALESCE(SUM(order_items.quantity), 0) as units,
                COALESCE(SUM(order_items.line_total_cents), 0) as revenue_cents
            ')
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('revenue_cents')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'name' => $r->name,
                'units' => (int) $r->units,
                'revenue_cents' => (int) $r->revenue_cents,
            ])
            ->values()
            ->all();
    }

    // -------------------------------------------------------------------------
    // Category performance (uses primary_category_id to avoid double-counting)
    // -------------------------------------------------------------------------

    /**
     * @return list<array{period:string, categories:array<string,int>}>
     */
    private function categoryPerformance(CarbonInterface $from, CarbonInterface $to, string $granularity): array
    {
        $periodExpr = $this->periodExpression($granularity);

        $rows = OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->join('categories', 'categories.id', '=', 'products.primary_category_id')
            ->whereIn('orders.status', self::REVENUE_STATUSES)
            ->whereBetween('orders.created_at', [$from, $to])
            ->selectRaw("
                {$periodExpr} as period,
                categories.name as category_name,
                COALESCE(SUM(order_items.line_total_cents), 0) as revenue_cents
            ")
            ->groupByRaw("{$periodExpr}, categories.id, categories.name")
            ->orderByRaw($periodExpr)
            ->get();

        // Pivot: [{period, categories: {name: cents}}]
        $byPeriod = [];

        foreach ($rows as $r) {
            $byPeriod[$r->period]['period'] = $r->period;
            $byPeriod[$r->period]['categories'][$r->category_name] = (int) $r->revenue_cents;
        }

        return array_values($byPeriod);
    }

    // -------------------------------------------------------------------------
    // Category drilldown
    // -------------------------------------------------------------------------

    /**
     * @return list<array{product_id:int|null, name:string, units:int, revenue_cents:int}>
     */
    private function categoryDrilldown(int $categoryId, CarbonInterface $from, CarbonInterface $to): array
    {
        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->where('products.primary_category_id', $categoryId)
            ->whereIn('orders.status', self::REVENUE_STATUSES)
            ->whereBetween('orders.created_at', [$from, $to])
            ->selectRaw('
                order_items.product_id,
                order_items.product_name as name,
                COALESCE(SUM(order_items.quantity), 0) as units,
                COALESCE(SUM(order_items.line_total_cents), 0) as revenue_cents
            ')
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('revenue_cents')
            ->get()
            ->map(fn ($r) => [
                'product_id' => $r->product_id,
                'name' => $r->name,
                'units' => (int) $r->units,
                'revenue_cents' => (int) $r->revenue_cents,
            ])
            ->values()
            ->all();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Returns order IDs that contain at least one item from the given category,
     * or null when no category filter is applied (meaning "all orders").
     *
     * @return \Illuminate\Support\Collection<int,int>|null
     */
    private function orderIdsForCategory(CarbonInterface $from, CarbonInterface $to, ?int $categoryId): ?\Illuminate\Support\Collection
    {
        if ($categoryId === null) {
            return null;
        }

        return OrderItem::query()
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->join('products', 'products.id', '=', 'order_items.product_id')
            ->whereIn('orders.status', self::REVENUE_STATUSES)
            ->whereBetween('orders.created_at', [$from, $to])
            ->where('products.primary_category_id', $categoryId)
            ->pluck('order_items.order_id')
            ->unique();
    }

    /** @return array{0:Carbon,1:Carbon} */
    private function dateRange(string $range): array
    {
        $to = now()->endOfDay();

        $from = match ($range) {
            'last_30_days' => now()->subDays(29)->startOfDay(),
            'last_90_days' => now()->subDays(89)->startOfDay(),
            'ytd' => now()->startOfYear()->startOfDay(),
            default => now()->subMonths(11)->startOfMonth()->startOfDay(), // last_12_months
        };

        return [$from, $to];
    }

    private function periodExpression(string $granularity): string
    {
        return match ($granularity) {
            'day' => "DATE_FORMAT(orders.created_at, '%Y-%m-%d')",
            'year' => "DATE_FORMAT(orders.created_at, '%Y')",
            'season' => "CONCAT(DATE_FORMAT(orders.created_at, '%Y'), '-Q', QUARTER(orders.created_at))",
            default => "DATE_FORMAT(orders.created_at, '%Y-%m')", // month
        };
    }
}
