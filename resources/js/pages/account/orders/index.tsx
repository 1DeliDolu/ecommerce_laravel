import { Head, Link, usePage } from '@inertiajs/react';
import TierBadge from '@/components/tier-badge';
import AppLayout from '@/layouts/app-layout';
import { index as accountOrdersIndex } from '@/routes/account/orders';
import type { Auth, BreadcrumbItem } from '@/types';

type OrderRow = {
    id: number;
    user_id: number | null;
    public_id: string;
    status: 'pending' | 'paid' | 'shipped' | 'cancelled';
    total: string;
    placed_at: string | null;
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: accountOrdersIndex().url },
];

function formatMoney(amount: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number(amount));
}

function formatDate(value: string | null): string {
    if (!value) {
        return '-';
    }

    return new Date(value).toLocaleString();
}

function stripHtml(label: string): string {
    return label.replace(/<[^>]*>/g, '').trim();
}

function statusClasses(status: OrderRow['status']): string {
    if (status === 'paid') {
        return 'bg-emerald-500/10 text-emerald-700';
    }

    if (status === 'shipped') {
        return 'bg-sky-500/10 text-sky-700';
    }

    if (status === 'cancelled') {
        return 'bg-destructive/10 text-destructive';
    }

    return 'bg-amber-500/10 text-amber-700';
}

export default function OrdersIndex() {
    const { auth, orders } = usePage<{ auth: Auth; orders: Paginator<OrderRow> }>().props;
    const visibleOrders = orders.data.filter((order) => order.user_id === auth.user.id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="space-y-6 p-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <h1 className="text-xl font-semibold">Orders</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Your tier:</span>
                            <TierBadge tier={auth.user.tier} />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Reference</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Items</th>
                                    <th className="px-4 py-3 font-medium">Total</th>
                                    <th className="px-4 py-3 font-medium">Placed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleOrders.length === 0 ? (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                                            You do not have any orders yet.
                                        </td>
                                    </tr>
                                ) : (
                                    visibleOrders.map((order) => (
                                        <tr key={order.id} className="border-b last:border-b-0">
                                            <td className="px-4 py-3 font-medium">{order.public_id}</td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded px-2 py-1 text-xs ${statusClasses(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{order.items_count}</td>
                                            <td className="px-4 py-3 font-medium">{formatMoney(order.total)}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(order.placed_at)}
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
                                    Showing <span className="font-medium">{visibleOrders.length}</span>
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
                                        className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-background hover:bg-accent'
                                        }`}
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
