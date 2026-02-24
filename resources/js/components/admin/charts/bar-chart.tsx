import BaseChart from '@/components/admin/charts/base-chart';
import type { SimpleChartPoint } from '@/components/admin/charts/types';

type BarChartProps = {
    title: string;
    description: string;
    points: SimpleChartPoint[];
    emptyText: string;
    valueFormatter: (value: number) => string;
};

export default function BarChart({
    title,
    description,
    points,
    emptyText,
    valueFormatter,
}: BarChartProps) {
    if (points.length === 0) {
        return (
            <BaseChart title={title} description={description}>
                <p className="text-sm text-muted-foreground">{emptyText}</p>
            </BaseChart>
        );
    }

    const maxValue = Math.max(...points.map((point) => point.value), 1);
    const barGradients = [
        'linear-gradient(90deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 65%, white))',
        'linear-gradient(90deg, var(--chart-2), color-mix(in oklab, var(--chart-2) 65%, white))',
        'linear-gradient(90deg, var(--chart-3), color-mix(in oklab, var(--chart-3) 65%, white))',
        'linear-gradient(90deg, var(--chart-4), color-mix(in oklab, var(--chart-4) 65%, white))',
        'linear-gradient(90deg, var(--chart-5), color-mix(in oklab, var(--chart-5) 65%, white))',
    ];

    return (
        <BaseChart title={title} description={description}>
            <div className="space-y-3">
                {points.map((point, index) => (
                    <div key={point.label} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                            <span>{point.label}</span>
                            <span className="text-muted-foreground">
                                {valueFormatter(point.value)}
                            </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                            <div
                                className="h-2 rounded-full bg-primary/70"
                                style={{
                                    width: `${Math.max(2, (point.value / maxValue) * 100)}%`,
                                    background: barGradients[index % barGradients.length],
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </BaseChart>
    );
}
