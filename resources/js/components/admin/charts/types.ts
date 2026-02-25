export type ChartSeriesPoint = {
    period: string;
    revenue_cents: number;
    orders: number;
    units: number;
    value: number;
};

export type SimpleChartPoint = {
    label: string;
    value: number;
    hint?: string;
};

export type BuilderScope = 'overall' | 'category' | 'product';

export type BuilderMetric = 'revenue' | 'units' | 'orders';

export type BuilderGranularity = 'day' | 'week' | 'month' | 'season' | 'year';

export type BuilderRange = '7d' | '15d' | '30d' | '60d' | '90d' | '180d' | '360d';

export type BuilderChartType = 'area' | 'bar' | 'line' | 'tooltip';
