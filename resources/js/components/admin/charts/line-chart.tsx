import * as React from 'react';
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart as ReLineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
} from 'recharts';
import BaseChart from '@/components/admin/charts/base-chart';
import {
    formatChartDateLabel,
    toChartRows,
} from '@/components/admin/charts/chart-data';
import type { SimpleChartPoint } from '@/components/admin/charts/types';

type LineChartProps = {
    title: string;
    description: string;
    points: SimpleChartPoint[];
    emptyText: string;
    seriesLabel?: string;
};

export default function LineChart({
    title,
    description,
    points,
    emptyText,
    seriesLabel,
}: LineChartProps) {
    const legendLabel = seriesLabel ?? 'Selected';
    const chartData = React.useMemo(() => toChartRows(points), [points]);
    const totalValue = React.useMemo(() => {
        return chartData.reduce((sum, row) => sum + row.value, 0);
    }, [chartData]);

    if (points.length === 0) {
        return (
            <BaseChart title={title} description={description}>
                <p className="text-sm text-muted-foreground">{emptyText}</p>
            </BaseChart>
        );
    }

    return (
        <BaseChart
            title={title}
            description={description}
            footer={`Total: ${new Intl.NumberFormat('en-US').format(totalValue)}`}
        >
            <div className="aspect-auto h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ReLineChart
                        data={chartData}
                        margin={{ top: 6, right: 12, left: 12, bottom: 0 }}
                    >
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
                        <Line
                            dataKey="value"
                            name={legendLabel}
                            type="monotone"
                            stroke="var(--chart-2)"
                            strokeWidth={2.25}
                            dot={false}
                        />
                        <Legend
                            iconType="square"
                            formatter={() => legendLabel}
                            wrapperStyle={{ paddingTop: 8 }}
                        />
                    </ReLineChart>
                </ResponsiveContainer>
            </div>
        </BaseChart>
    );
}
