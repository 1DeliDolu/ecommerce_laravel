import { useEffect, useMemo, useState } from 'react';
import AreaChart from '@/components/admin/charts/area-chart';
import BarChart from '@/components/admin/charts/bar-chart';
import BaseChart from '@/components/admin/charts/base-chart';
import LineChart from '@/components/admin/charts/line-chart';
import TooltipDemoChart from '@/components/admin/charts/tooltip-demo-chart';
import type {
    BuilderChartType,
    BuilderGranularity,
    BuilderMetric,
    BuilderRange,
    BuilderScope,
    ChartSeriesPoint,
    SimpleChartPoint,
} from '@/components/admin/charts/types';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import admin from '@/routes/admin';

type CategoryOption = {
    id: number;
    name: string;
};

type ProductOption = {
    id: number;
    name: string;
};

type BootstrapResponse = {
    categories: CategoryOption[];
    defaults: {
        scope: BuilderScope;
        metric: BuilderMetric;
        granularity: BuilderGranularity;
        range: BuilderRange;
    };
    options: {
        scopes: BuilderScope[];
        metrics: BuilderMetric[];
        granularities: BuilderGranularity[];
        ranges: BuilderRange[];
    };
    series: ChartSeriesPoint[];
};

type CategoryProductsResponse = {
    products: ProductOption[];
};

type TimeseriesResponse = {
    filters: {
        scope: BuilderScope;
        scope_id: number | null;
        metric: BuilderMetric;
        granularity: BuilderGranularity;
        range: BuilderRange;
    };
    statuses_included: string[];
    series: ChartSeriesPoint[];
};

function formatMoney(cents: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(cents / 100);
}

function formatMetricValue(metric: BuilderMetric, value: number): string {
    if (metric === 'revenue') {
        return formatMoney(value);
    }

    return new Intl.NumberFormat('en-US').format(value);
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}.`);
    }

    return (await response.json()) as T;
}

export default function ChartBuilder() {
    const [bootstrapping, setBootstrapping] = useState(true);
    const [loadingSeries, setLoadingSeries] = useState(false);
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [scope, setScope] = useState<BuilderScope>('overall');
    const [metric, setMetric] = useState<BuilderMetric>('revenue');
    const [granularity, setGranularity] = useState<BuilderGranularity>('day');
    const [range, setRange] = useState<BuilderRange>('90d');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [chartType, setChartType] = useState<BuilderChartType>('area');
    const [series, setSeries] = useState<ChartSeriesPoint[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        void (async () => {
            setBootstrapping(true);
            setError(null);

            try {
                const data = await fetchJson<BootstrapResponse>(
                    admin.analytics.bootstrap.url(),
                );
                setCategories(data.categories);
                setScope(data.defaults.scope);
                setMetric(data.defaults.metric);
                setGranularity(data.defaults.granularity);
                setRange(data.defaults.range);
                setSeries(data.series);
            } catch (fetchError) {
                setError(
                    fetchError instanceof Error
                        ? fetchError.message
                        : 'Failed to load chart builder.',
                );
            } finally {
                setBootstrapping(false);
            }
        })();
    }, []);

    const chartPoints = useMemo<SimpleChartPoint[]>(() => {
        return series.map((point) => ({
            label: point.period,
            value: point.value,
            hint: `${formatMoney(point.revenue_cents)} revenue · ${point.orders} orders · ${point.units} units`,
        }));
    }, [series]);

    async function loadCategoryProducts(
        categoryId: number | null,
        autoSelectFirstProduct = false,
    ): Promise<void> {
        const data = await fetchJson<CategoryProductsResponse>(
            admin.analytics.categoryProducts.url({
                query: categoryId !== null ? { category_id: categoryId } : {},
            }),
        );

        setProducts(data.products);

        if (autoSelectFirstProduct) {
            setSelectedProductId(data.products[0]?.id ?? null);
        }
    }

    async function generateChart(
        overrides?: Partial<{
            scope: BuilderScope;
            metric: BuilderMetric;
            granularity: BuilderGranularity;
            range: BuilderRange;
            selectedCategoryId: number | null;
            selectedProductId: number | null;
        }>,
    ): Promise<void> {
        const targetScope = overrides?.scope ?? scope;
        const targetMetric = overrides?.metric ?? metric;
        const targetGranularity = overrides?.granularity ?? granularity;
        const targetRange = overrides?.range ?? range;
        const targetCategoryId = overrides?.selectedCategoryId ?? selectedCategoryId;
        const targetProductId = overrides?.selectedProductId ?? selectedProductId;

        const scopeId =
            targetScope === 'overall'
                ? null
                : targetScope === 'category'
                  ? targetCategoryId
                  : targetProductId;

        if (targetScope !== 'overall' && scopeId === null) {
            return;
        }

        setLoadingSeries(true);
        setError(null);

        try {
            const query: Record<string, string | number> = {
                scope: targetScope,
                metric: targetMetric,
                granularity: targetGranularity,
                range: targetRange,
            };

            if (scopeId !== null) {
                query.scope_id = scopeId;
            }

            const data = await fetchJson<TimeseriesResponse>(
                admin.analytics.timeseries.url({
                    query,
                }),
            );

            setSeries(data.series);
        } catch (fetchError) {
            setError(
                fetchError instanceof Error
                    ? fetchError.message
                    : 'Failed to generate chart data.',
            );
        } finally {
            setLoadingSeries(false);
        }
    }

    const generatedDescription = `Scope: ${scope} · Metric: ${metric} · Frequency: ${granularity} · Last: ${range}`;
    const selectedCategoryName =
        categories.find((category) => category.id === selectedCategoryId)?.name ?? null;
    const selectedProductName =
        products.find((product) => product.id === selectedProductId)?.name ?? null;
    const areaSeriesLabel =
        scope === 'category'
            ? selectedCategoryName ?? 'Selected category'
            : scope === 'product'
              ? selectedProductName ?? 'Selected product'
              : 'Overall';
    const noCategoriesAvailable = categories.length === 0;
    const requiresCategory = scope === 'category';
    const requiresProduct = scope === 'product';
    const hasRequiredSelections =
        (!requiresCategory || selectedCategoryId !== null) &&
        (!requiresProduct || selectedProductId !== null);
    const canGenerate = !bootstrapping && !loadingSeries && hasRequiredSelections;

    return (
        <div className="space-y-4">
            <BaseChart
                title="Chart Builder"
                description="Select scope, category/product, metric, and time bucket to generate a chart."
            >
                {bootstrapping ? (
                    <div className="grid gap-2 md:grid-cols-4">
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                            <select
                                value={scope}
                                onChange={(event) => {
                                    const nextScope = event.target.value as BuilderScope;
                                    setScope(nextScope);
                                    setError(null);
                                    setSelectedProductId(null);

                                    if (nextScope === 'overall') {
                                        setProducts([]);
                                    }

                                    if (nextScope === 'product') {
                                        void loadCategoryProducts(
                                            selectedCategoryId,
                                            true,
                                        );
                                    }
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="overall">Overall</option>
                                <option
                                    value="category"
                                    disabled={noCategoriesAvailable}
                                >
                                    Category
                                </option>
                                <option value="product">Product</option>
                            </select>

                            <select
                                value={metric}
                                onChange={(event) => {
                                    setError(null);
                                    setMetric(event.target.value as BuilderMetric);
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="revenue">Revenue</option>
                                <option value="units">Units</option>
                                <option value="orders">Orders</option>
                            </select>

                            <select
                                value={granularity}
                                onChange={(event) => {
                                    setError(null);
                                    setGranularity(
                                        event.target.value as BuilderGranularity,
                                    );
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="day">Daily</option>
                                <option value="week">Weekly</option>
                                <option value="month">Monthly</option>
                                <option value="season">Quarterly</option>
                                <option value="year">Yearly</option>
                            </select>

                            <select
                                value={range}
                                onChange={(event) => {
                                    setError(null);
                                    setRange(event.target.value as BuilderRange);
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="7d">Last 7 days</option>
                                <option value="15d">Last 15 days</option>
                                <option value="30d">Last 30 days</option>
                                <option value="60d">Last 60 days</option>
                                <option value="90d">Last 90 days</option>
                                <option value="180d">Last 180 days</option>
                                <option value="360d">Last 360 days</option>
                            </select>
                        </div>

                        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                            <select
                                value={selectedCategoryId ?? ''}
                                disabled={scope === 'overall' || noCategoriesAvailable}
                                onChange={(event) => {
                                    const rawValue = event.target.value;
                                    const nextCategoryId =
                                        rawValue === '' ? null : Number(rawValue);
                                    setError(null);
                                    setSelectedCategoryId(nextCategoryId);
                                    setSelectedProductId(null);
                                    setProducts([]);

                                    if (scope === 'product') {
                                        void loadCategoryProducts(
                                            nextCategoryId,
                                            true,
                                        );
                                    } else if (nextCategoryId !== null) {
                                        void loadCategoryProducts(
                                            nextCategoryId,
                                            false,
                                        );
                                    }
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
                            >
                                <option value="">
                                    {scope === 'product'
                                        ? 'Select category (optional)'
                                        : 'Select category'}
                                </option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={selectedProductId ?? ''}
                                disabled={scope !== 'product'}
                                onChange={(event) => {
                                    const rawValue = event.target.value;
                                    setError(null);
                                    setSelectedProductId(
                                        rawValue === '' ? null : Number(rawValue),
                                    );
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm disabled:opacity-50"
                            >
                                <option value="">
                                    {scope === 'product' && selectedCategoryId === null
                                        ? 'Select product (all categories)'
                                        : 'Select product'}
                                </option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={chartType}
                                onChange={(event) => {
                                    setError(null);
                                    setChartType(event.target.value as BuilderChartType);
                                }}
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            >
                                <option value="area">Area chart</option>
                                <option value="bar">Bar chart</option>
                                <option value="line">Line chart</option>
                                <option value="tooltip">Tooltip chart</option>
                            </select>

                            <Button
                                type="button"
                                onClick={() => void generateChart()}
                                disabled={!canGenerate}
                            >
                                {loadingSeries ? 'Generating...' : 'Generate chart'}
                            </Button>
                        </div>

                        {!hasRequiredSelections ? (
                            <p className="text-sm text-muted-foreground">
                                Select the required{' '}
                                {scope === 'product' ? 'product' : 'category'} to
                                generate this chart.
                            </p>
                        ) : null}

                        {noCategoriesAvailable ? (
                            <p className="text-sm text-muted-foreground">
                                No categories found. Category scope is disabled. You
                                can still generate product charts from all products.
                            </p>
                        ) : null}

                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : null}
                    </div>
                )}
            </BaseChart>

            {chartType === 'area' ? (
                <AreaChart
                    title="Generated Area Chart"
                    description={generatedDescription}
                    points={chartPoints}
                    emptyText="No points were generated for the selected options."
                    seriesLabel={areaSeriesLabel}
                    selectedRange={range}
                    onRangeChange={(nextRange) => {
                        setRange(nextRange);
                        void generateChart({ range: nextRange });
                    }}
                />
            ) : null}

            {chartType === 'bar' ? (
                <BarChart
                    title="Generated Bar Chart"
                    description={generatedDescription}
                    points={chartPoints}
                    emptyText="No points were generated for the selected options."
                    valueFormatter={(value) => formatMetricValue(metric, value)}
                />
            ) : null}

            {chartType === 'line' ? (
                <LineChart
                    title="Generated Line Chart"
                    description={generatedDescription}
                    points={chartPoints}
                    emptyText="No points were generated for the selected options."
                />
            ) : null}

            {chartType === 'tooltip' ? (
                <TooltipDemoChart
                    title="Generated Tooltip Chart"
                    description={generatedDescription}
                    points={chartPoints}
                    emptyText="No points were generated for the selected options."
                    valueFormatter={(value) => formatMetricValue(metric, value)}
                />
            ) : null}
        </div>
    );
}
