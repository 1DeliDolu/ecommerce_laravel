import { useMemo, useState } from 'react';
import BaseChart from '@/components/admin/charts/base-chart';
import type { SimpleChartPoint } from '@/components/admin/charts/types';

type TooltipDemoChartProps = {
    title: string;
    description: string;
    points: SimpleChartPoint[];
    emptyText: string;
    valueFormatter: (value: number) => string;
};

export default function TooltipDemoChart({
    title,
    description,
    points,
    emptyText,
    valueFormatter,
}: TooltipDemoChartProps) {
    const barGradients = [
        'linear-gradient(90deg, var(--chart-1), color-mix(in oklab, var(--chart-1) 65%, white))',
        'linear-gradient(90deg, var(--chart-2), color-mix(in oklab, var(--chart-2) 65%, white))',
        'linear-gradient(90deg, var(--chart-3), color-mix(in oklab, var(--chart-3) 65%, white))',
        'linear-gradient(90deg, var(--chart-4), color-mix(in oklab, var(--chart-4) 65%, white))',
        'linear-gradient(90deg, var(--chart-5), color-mix(in oklab, var(--chart-5) 65%, white))',
    ];

    const [activeLabel, setActiveLabel] = useState<string | null>(
        points[0]?.label ?? null,
    );
    const maxValue = Math.max(...points.map((point) => point.value), 1);

    const activePoint = useMemo(() => {
        return points.find((point) => point.label === activeLabel) ?? points[0] ?? null;
    }, [activeLabel, points]);

    if (points.length === 0) {
        return (
            <BaseChart title={title} description={description}>
                <p className="text-sm text-muted-foreground">{emptyText}</p>
            </BaseChart>
        );
    }

    return (
        <BaseChart title={title} description={description}>
            <div className="relative space-y-2">
                {activePoint ? (
                    <div className="rounded-md border bg-background p-3 text-xs">
                        <p className="font-medium">{activePoint.label}</p>
                        <p className="text-muted-foreground">
                            {valueFormatter(activePoint.value)}
                        </p>
                        {activePoint.hint ? (
                            <p className="mt-1 text-muted-foreground">{activePoint.hint}</p>
                        ) : null}
                    </div>
                ) : null}

                <div className="space-y-2">
                    {points.map((point, index) => (
                        <button
                            key={point.label}
                            type="button"
                            onMouseEnter={() => setActiveLabel(point.label)}
                            onFocus={() => setActiveLabel(point.label)}
                            className="block w-full text-left"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span>{point.label}</span>
                                <span className="text-muted-foreground">
                                    {valueFormatter(point.value)}
                                </span>
                            </div>
                            <div className="mt-1 h-2 rounded-full bg-muted">
                                <div
                                    className="h-2 rounded-full bg-primary"
                                    style={{
                                        width: `${Math.max(3, (point.value / maxValue) * 100)}%`,
                                        background:
                                            barGradients[index % barGradients.length],
                                    }}
                                />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </BaseChart>
    );
}
