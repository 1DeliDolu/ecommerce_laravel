import { Head, Link, useForm } from '@inertiajs/react';

import {
    show,
    updateStatus,
} from '@/actions/App/Http/Controllers/Admin/OrderController';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type OrderItem = {
    id: number;
    name: string;
    slug: string;
    qty: number;
    unit_price: string;
    line_total: string;
};

type OrderUser = {
    id: number;
    name: string;
    email: string;
} | null;

type Order = {
    id: number;
    public_id: string;
    status: string;
    created_at: string;

    first_name: string;
    last_name: string;
    email: string;
    phone: string;

    address1: string;
    address2: string | null;
    city: string;
    postal_code: string;
    country: string;

    currency: string;
    subtotal: string;
    tax: string;
    shipping: string;
    total: string;

    user: OrderUser;
    items: OrderItem[];
};

type Props = {
    order: Order;
    allowed_transitions: string[];
};

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800',
};

export default function AdminOrdersShow({ order, allowed_transitions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: '/admin/orders' },
        { title: order.public_id, href: show.url({ order: order.id }) },
    ];

    const { data, setData, patch, processing, errors } = useForm({
        status: '',
    });

    const handleStatusUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        patch(updateStatus.url({ order: order.id }), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Order ${order.public_id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-mono text-xl font-semibold tracking-tight">
                                {order.public_id}
                            </h1>
                            <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? 'bg-muted text-muted-foreground'}`}
                            >
                                {order.status}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Placed on{' '}
                            {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>

                    <Link
                        href="/admin/orders"
                        className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                        ← Back to orders
                    </Link>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column – items + totals */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Order items */}
                        <div className="rounded-lg border bg-card">
                            <div className="border-b px-4 py-3">
                                <h2 className="font-medium">Items</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-left">
                                            <th className="px-4 py-3 font-medium text-muted-foreground">
                                                Product
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                                Qty
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                                Unit
                                            </th>
                                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {order.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">
                                                    {item.name}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {item.qty}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {order.currency}{' '}
                                                    {item.unit_price}
                                                </td>
                                                <td className="px-4 py-3 text-right tabular-nums">
                                                    {order.currency}{' '}
                                                    {item.line_total}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="space-y-1 border-t px-4 py-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Subtotal
                                    </span>
                                    <span className="tabular-nums">
                                        {order.currency} {order.subtotal}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Shipping
                                    </span>
                                    <span className="tabular-nums">
                                        {order.currency} {order.shipping}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Tax
                                    </span>
                                    <span className="tabular-nums">
                                        {order.currency} {order.tax}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-2 font-semibold">
                                    <span>Total</span>
                                    <span className="tabular-nums">
                                        {order.currency} {order.total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column – customer, address, status */}
                    <div className="space-y-6">
                        {/* Customer */}
                        <div className="rounded-lg border bg-card">
                            <div className="border-b px-4 py-3">
                                <h2 className="font-medium">Customer</h2>
                            </div>
                            <div className="px-4 py-4 text-sm">
                                <p className="font-medium">
                                    {order.first_name} {order.last_name}
                                </p>
                                <p className="text-muted-foreground">
                                    {order.email}
                                </p>
                                {order.phone && (
                                    <p className="text-muted-foreground">
                                        {order.phone}
                                    </p>
                                )}
                                {order.user && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Registered as{' '}
                                        <span className="font-medium">
                                            {order.user.name}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Shipping address */}
                        <div className="rounded-lg border bg-card">
                            <div className="border-b px-4 py-3">
                                <h2 className="font-medium">
                                    Shipping address
                                </h2>
                            </div>
                            <div className="px-4 py-4 text-sm text-muted-foreground">
                                <p>{order.address1}</p>
                                {order.address2 && <p>{order.address2}</p>}
                                <p>
                                    {order.postal_code} {order.city}
                                </p>
                                <p>{order.country}</p>
                            </div>
                        </div>

                        {/* Status update */}
                        {allowed_transitions.length > 0 && (
                            <div className="rounded-lg border bg-card">
                                <div className="border-b px-4 py-3">
                                    <h2 className="font-medium">
                                        Update status
                                    </h2>
                                </div>
                                <form
                                    onSubmit={handleStatusUpdate}
                                    className="px-4 py-4"
                                >
                                    <div className="space-y-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                New status
                                            </label>
                                            <select
                                                value={data.status}
                                                onChange={(e) =>
                                                    setData(
                                                        'status',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                                            >
                                                <option value="">
                                                    Select status…
                                                </option>
                                                {allowed_transitions.map(
                                                    (s) => (
                                                        <option
                                                            key={s}
                                                            value={s}
                                                        >
                                                            {s
                                                                .charAt(0)
                                                                .toUpperCase() +
                                                                s.slice(1)}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                            {errors.status && (
                                                <p className="mt-1 text-xs text-red-600">
                                                    {errors.status}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={
                                                processing || data.status === ''
                                            }
                                            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 disabled:opacity-50"
                                        >
                                            {processing
                                                ? 'Updating…'
                                                : 'Update status'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {allowed_transitions.length === 0 && (
                            <div className="rounded-lg border bg-card px-4 py-4 text-sm text-muted-foreground">
                                No further status transitions available.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
