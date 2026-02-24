import * as React from 'react';
import {
    Area,
    AreaChart as ReAreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts';
import BaseChart from '@/components/admin/charts/base-chart';
import {
    filterRowsByRange,
    formatChartDateLabel,
    toChartRows,
} from '@/components/admin/charts/chart-data';
import type {
    BuilderRange,
    SimpleChartPoint,
} from '@/components/admin/charts/types';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type AreaChartProps = {
    title: string;
    description: string;
    points: SimpleChartPoint[];
    emptyText: string;
    seriesLabel?: string;
    selectedRange?: BuilderRange;
    onRangeChange?: (range: BuilderRange) => void;
};

const RANGE_LABELS: Record<BuilderRange, string> = {
    '7d': 'Last 7 days',
    '15d': 'Last 15 days',
    '30d': 'Last 30 days',
    '60d': 'Last 60 days',
    '90d': 'Last 3 months',
    '180d': 'Last 6 months',
    '360d': 'Last 12 months',
};

export default function AreaChart({
    title,
    description,
    points,
    emptyText,
    seriesLabel,
    selectedRange,
    onRangeChange,
}: AreaChartProps) {
    const chartId = React.useId().replace(/:/g, '');
    const rangeValue = selectedRange ?? '90d';
    const legendLabel = seriesLabel ?? 'Selected';
    const fillGradientId = `${chartId}-fill-value`;

    const chartData = React.useMemo(() => {
        return toChartRows(points);
    }, [points]);

    const filteredData = React.useMemo(() => {
        return filterRowsByRange(chartData, rangeValue);
    }, [chartData, rangeValue]);

    if (points.length === 0) {
        return (
            <BaseChart title={title} description={description}>
                <p className="text-sm text-muted-foreground">{emptyText}</p>
            </BaseChart>
        );
    }

    const actions = onRangeChange ? (
        <Select value={rangeValue} onValueChange={(value) => onRangeChange(value as BuilderRange)}>
            <SelectTrigger
                className="hidden w-[170px] rounded-lg sm:ml-auto sm:flex"
                aria-label="Select a range"
            >
                <SelectValue placeholder={RANGE_LABELS[rangeValue]} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
                <SelectItem value="360d" className="rounded-lg">
                    Last 12 months
                </SelectItem>
                <SelectItem value="180d" className="rounded-lg">
                    Last 6 months
                </SelectItem>
                <SelectItem value="90d" className="rounded-lg">
                    Last 3 months
                </SelectItem>
                <SelectItem value="60d" className="rounded-lg">
                    Last 60 days
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                    Last 30 days
                </SelectItem>
                <SelectItem value="15d" className="rounded-lg">
                    Last 15 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                    Last 7 days
                </SelectItem>
            </SelectContent>
        </Select>
    ) : null;

    return (
        <BaseChart title={title} description={description} actions={actions}>
            <div className="aspect-auto h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ReAreaChart
                        data={filteredData}
                        margin={{ top: 6, right: 10, left: 4, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                                <stop
                                    offset="95%"
                                    stopColor="var(--chart-1)"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} />

                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value: string | number) =>
                                formatChartDateLabel(String(value))
                            }
                        />

                        <Tooltip
                            cursor={false}
                            labelFormatter={(value: React.ReactNode) =>
                                formatChartDateLabel(String(value ?? ''))
                            }
                            formatter={(value: string | number | undefined) => [
                                new Intl.NumberFormat('en-US').format(Number(value ?? 0)),
                                legendLabel,
                            ]}
                        />

                        <Area
                            dataKey="value"
                            type="natural"
                            name={legendLabel}
                            fill={`url(#${fillGradientId})`}
                            stroke="var(--chart-1)"
                            strokeWidth={2}
                        />

                        <Legend
                            iconType="square"
                            formatter={() => legendLabel}
                            wrapperStyle={{ paddingTop: 8 }}
                        />
                    </ReAreaChart>
                </ResponsiveContainer>
            </div>
        </BaseChart>
    );
}
