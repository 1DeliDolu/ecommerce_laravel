import type {
    BuilderRange,
    SimpleChartPoint,
} from '@/components/admin/charts/types';

export type ChartRow = {
    date: string;
    value: number;
    hint?: string;
};

function rangeToDays(range: BuilderRange): number {
    switch (range) {
        case '7d':
            return 7;
        case '15d':
            return 15;
        case '30d':
            return 30;
        case '60d':
            return 60;
        case '90d':
            return 90;
        case '180d':
            return 180;
        case '360d':
            return 360;
        default:
            return 90;
    }
}

function parseLabelToDate(label: string): Date | null {
    const direct = new Date(label);

    if (!Number.isNaN(direct.getTime())) {
        return direct;
    }

    if (/^\d{4}-\d{2}$/.test(label)) {
        const monthDate = new Date(`${label}-01T00:00:00`);

        if (!Number.isNaN(monthDate.getTime())) {
            return monthDate;
        }
    }

    const quarter = label.match(/^(\d{4})-Q([1-4])$/);

    if (quarter) {
        const year = Number(quarter[1]);
        const quarterIndex = Number(quarter[2]) - 1;
        const month = quarterIndex * 3;
        const quarterDate = new Date(Date.UTC(year, month, 1));

        if (!Number.isNaN(quarterDate.getTime())) {
            return quarterDate;
        }
    }

    return null;
}

function subtractDays(from: Date, days: number): Date {
    const date = new Date(from);
    date.setDate(date.getDate() - days);

    return date;
}

export function toChartRows(points: SimpleChartPoint[]): ChartRow[] {
    return points.map((point) => ({
        date: point.label,
        value: point.value,
        hint: point.hint,
    }));
}

export function filterRowsByRange(
    rows: ChartRow[],
    range: BuilderRange,
): ChartRow[] {
    if (rows.length === 0) {
        return [];
    }

    const parsedRows = rows
        .map((row) => ({
            row,
            date: parseLabelToDate(row.date),
        }))
        .filter((entry): entry is { row: ChartRow; date: Date } => !!entry.date);

    if (parsedRows.length === 0) {
        return rows;
    }

    const referenceDate = parsedRows.reduce(
        (latest, entry) => (entry.date > latest ? entry.date : latest),
        parsedRows[0].date,
    );

    const startDate = subtractDays(referenceDate, rangeToDays(range));

    return parsedRows
        .filter((entry) => entry.date >= startDate)
        .sort((left, right) => left.date.getTime() - right.date.getTime())
        .map((entry) => entry.row);
}

export function formatChartDateLabel(label: string): string {
    const directDate = new Date(label);

    if (!Number.isNaN(directDate.getTime())) {
        return directDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
        });
    }

    if (/^\d{4}-\d{2}$/.test(label)) {
        const monthDate = new Date(`${label}-01T00:00:00`);

        if (!Number.isNaN(monthDate.getTime())) {
            return monthDate.toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit',
            });
        }
    }

    return label.length > 11 ? `${label.slice(0, 11)}...` : label;
}
