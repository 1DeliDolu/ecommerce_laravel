import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { index } from '@/actions/App/Http/Controllers/Admin/OrderController';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Order = {
    id: number;
    public_id: string;
    status: string;
    first_name: string;
    last_name: string;
    email: string;
    total_cents: number;
    items_count: number;
    created_at: string;
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
        current_page: number;
        from: number | null;
        to: number | null;
        total: number;
        last_page: number;
    };
};

type Filters = {
    q: string;
    status: string;
};

type Props = {
    orders: Paginator<Order>;
    filters: Filters;
    statuses: string[];
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Orders', href: '/admin/orders' }];

export default function AdminOrdersIndex({ orders, filters, statuses }: Props) {
    const [local, setLocal] = useState<Filters>(filters);

    useEffect(() => {
        setLocal(filters);
    }, [filters.q, filters.status]);

    const applyFilters = (next: Filters) => {
        setLocal(next);
        router.get(
            index.url(),
            { q: next.q || '', status: next.status || 'all' },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    // Debounce search input
    useEffect(() => {
        const handle = window.setTimeout(() => {
            router.get(
                index.url(),
                { q: local.q || '', status: local.status || 'all' },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local.q]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
                        <p className="text-sm text-muted-foreground">
                            View and manage customer orders.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-card p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="sm:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Search
                            </label>
                            <input
                                value={local.q}
                                onChange={(e) => setLocal((p) => ({ ...p, q: e.target.value }))}
                                placeholder="Reference, name or email…"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Status
                            </label>
                            <select
                                value={local.status}
                                onChange={(e) => applyFilters({ ...local, status: e.target.value })}
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All statuses</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border bg-card">
                    {orders.data.length === 0 ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">
                            No orders found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-left">
                                        <th className="px-4 py-3 font-medium text-muted-foreground">
                                            Reference
                                        </th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                            Total
                                        </th>
                                        <th className="px-4 py-3 font-medium text-muted-foreground">
                                            Date
                                        </th>
                                        <th className="px-4 py-3" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orders.data.map((order) => (
                                        <tr key={order.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {order.public_id}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {order.first_name} {order.last_name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {order.email}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}
                                                >
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">
                                                {(order.total_cents / 100).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-xs font-medium text-primary hover:underline"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {orders.links.length > 3 && (
                    <div className="flex flex-wrap items-center justify-center gap-1">
                        {orders.links.map((link, i) => (
                            <button
                                key={i}
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url)}
                                className={`rounded px-3 py-1.5 text-sm ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'border bg-background hover:bg-accent disabled:opacity-40'
                                }`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
