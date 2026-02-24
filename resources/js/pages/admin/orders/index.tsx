import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { index as ordersIndex, show as ordersShow } from '@/routes/admin/orders';
import type { BreadcrumbItem } from '@/types';

type OrderRow = {
    id: number;
    public_id: string;
    email: string;
    status: 'pending' | 'paid' | 'shipped' | 'cancelled';
    total: string;
    created_at: string;
    items_count: number;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginationLink[];
    meta?: {
        from: number | null;
        to: number | null;
        total: number;
    };
};

type Props = {
    orders: Paginator<OrderRow>;
    filters: {
        q: string;
        status: 'all' | 'pending' | 'paid' | 'shipped' | 'cancelled';
        date_from: string;
        date_to: string;
    };
    statuses: Array<'pending' | 'paid' | 'shipped' | 'cancelled'>;
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Orders', href: ordersIndex().url }];

function stripHtml(label: string): string {
    return label.replace(/<[^>]*>/g, '').trim();
}

function formatMoney(amount: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number(amount));
}

function formatDate(value: string): string {
    return new Date(value).toLocaleString();
}

function statusClasses(status: Props['statuses'][number]): string {
    if (status === 'paid') return 'bg-emerald-500/10 text-emerald-700';
    if (status === 'shipped') return 'bg-sky-500/10 text-sky-700';
    if (status === 'cancelled') return 'bg-destructive/10 text-destructive';

    return 'bg-amber-500/10 text-amber-700';
}

export default function AdminOrdersIndex({ orders, filters, statuses }: Props) {
    const [q, setQ] = useState(filters.q ?? '');
    const [status, setStatus] = useState<Props['filters']['status']>(
        filters.status ?? 'all',
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const applyFilters = (next: {
        q: string;
        status: Props['filters']['status'];
        date_from: string;
        date_to: string;
    }) => {
        router.get(
            ordersIndex().url,
            {
                q: next.q,
                status: next.status,
                date_from: next.date_from,
                date_to: next.date_to,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            applyFilters({
                q,
                status,
                date_from: dateFrom,
                date_to: dateTo,
            });
        }, 350);

        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [q]);

    useEffect(() => {
        applyFilters({
            q,
            status,
            date_from: dateFrom,
            date_to: dateTo,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, dateFrom, dateTo]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
                    <p className="text-sm text-muted-foreground">
                        Review customer orders and drill into details.
                    </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Search
                            </label>
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Reference or email"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Status
                            </label>
                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(
                                        event.target
                                            .value as Props['filters']['status'],
                                    )
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All</option>
                                {statuses.map((item) => (
                                    <option key={item} value={item}>
                                        {item}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setQ('');
                                    setStatus('all');
                                    setDateFrom('');
                                    setDateTo('');
                                    applyFilters({
                                        q: '',
                                        status: 'all',
                                        date_from: '',
                                        date_to: '',
                                    });
                                }}
                                className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                            >
                                Reset
                            </button>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Date from
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(event) =>
                                    setDateFrom(event.target.value)
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Date to
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) => setDateTo(event.target.value)}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Reference</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Items</th>
                                    <th className="px-4 py-3 font-medium">Total</th>
                                    <th className="px-4 py-3 font-medium">Created</th>
                                    <th className="px-4 py-3 font-medium" />
                                </tr>
                            </thead>

                            <tbody>
                                {orders.data.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-4 py-8 text-center text-muted-foreground"
                                            colSpan={7}
                                        >
                                            No orders found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.data.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3 font-medium">
                                                {order.public_id}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {order.email}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`rounded px-2 py-1 text-xs ${statusClasses(order.status)}`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                {order.items_count}
                                            </td>
                                            <td className="px-4 py-3 font-medium">
                                                {formatMoney(order.total)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(order.created_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end">
                                                    <Link
                                                        href={ordersShow(
                                                            order.public_id,
                                                        )}
                                                        className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                                    >
                                                        View
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-muted-foreground">
                            {orders.meta?.from != null && orders.meta?.to != null ? (
                                <>
                                    Showing <span className="font-medium">{orders.meta.from}</span>-<span className="font-medium">{orders.meta.to}</span> of <span className="font-medium">{orders.meta.total}</span>
                                </>
                            ) : (
                                <>
                                    Showing <span className="font-medium">{orders.data.length}</span>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                            {orders.links.map((link, index) => {
                                const label = stripHtml(link.label);

                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${label}-${index}`}
                                            className="cursor-not-allowed rounded-md border px-3 py-1.5 text-xs text-muted-foreground opacity-60"
                                        >
                                            {label}
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={`${label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        className={[
                                            'rounded-md border px-3 py-1.5 text-xs',
                                            link.active
                                                ? 'bg-accent font-medium'
                                                : 'bg-background hover:bg-accent',
                                        ].join(' ')}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
