import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    index as ordersIndex,
    show as ordersShow,
    updateStatus as ordersUpdateStatus,
} from '@/routes/admin/orders';
import type { BreadcrumbItem } from '@/types';

type OrderItem = {
    id: number;
    product_name: string;
    product_sku: string | null;
    quantity: number;
    unit_price: string;
    line_total: string;
};

type OrderUser = {
    id: number;
    name: string;
    email: string;
} | null;

type ShippingSnapshot = {
    line1?: string;
    line2?: string | null;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
} | null;

type OrderDetails = {
    id: number;
    public_id: string;
    status: 'pending' | 'paid' | 'shipped' | 'cancelled';
    email: string;
    customer_name: string | null;
    phone: string | null;
    subtotal: string;
    shipping_total: string;
    tax_total: string;
    total: string;
    shipping_address_snapshot: ShippingSnapshot;
    created_at: string;
    items: OrderItem[];
    user: OrderUser;
};

type Props = {
    order: OrderDetails;
    allowedStatuses: Array<'pending' | 'paid' | 'shipped' | 'cancelled'>;
};

function formatMoney(amount: string): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(Number(amount));
}

function statusClasses(status: OrderDetails['status']): string {
    if (status === 'paid') return 'bg-emerald-500/10 text-emerald-700';
    if (status === 'shipped') return 'bg-sky-500/10 text-sky-700';
    if (status === 'cancelled') return 'bg-destructive/10 text-destructive';

    return 'bg-amber-500/10 text-amber-700';
}

export default function AdminOrderShow({ order, allowedStatuses }: Props) {
    const form = useForm({
        status: order.status,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: ordersIndex().url },
        { title: order.public_id, href: ordersShow(order.public_id).url },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Order ${order.public_id}`} />

            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {order.public_id}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Created {new Date(order.created_at).toLocaleString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span
                            className={`rounded px-2 py-1 text-xs ${statusClasses(order.status)}`}
                        >
                            {order.status}
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                void navigator.clipboard.writeText(order.public_id);
                            }}
                            className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                        >
                            Copy reference
                        </button>

                        <Link
                            href={ordersIndex()}
                            className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                        >
                            Back to list
                        </Link>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <div className="space-y-4 lg:col-span-2">
                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Customer
                            </h2>

                            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                                <div>
                                    <dt className="text-muted-foreground">Name</dt>
                                    <dd className="font-medium">
                                        {order.customer_name ?? '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Email</dt>
                                    <dd className="font-medium">{order.email}</dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">Phone</dt>
                                    <dd className="font-medium">
                                        {order.phone ?? '—'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-muted-foreground">User</dt>
                                    <dd className="font-medium">
                                        {order.user ? order.user.name : 'Guest'}
                                    </dd>
                                </div>
                            </dl>
                        </section>

                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Shipping Snapshot
                            </h2>

                            <div className="mt-3 text-sm">
                                {order.shipping_address_snapshot ? (
                                    <div className="space-y-1">
                                        <div>{order.shipping_address_snapshot.line1}</div>
                                        {order.shipping_address_snapshot.line2 && (
                                            <div>{order.shipping_address_snapshot.line2}</div>
                                        )}
                                        <div>
                                            {order.shipping_address_snapshot.city},{' '}
                                            {order.shipping_address_snapshot.state}{' '}
                                            {
                                                order.shipping_address_snapshot
                                                    .postal_code
                                            }
                                        </div>
                                        <div>
                                            {
                                                order.shipping_address_snapshot
                                                    .country
                                            }
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">
                                        No shipping snapshot available.
                                    </p>
                                )}
                            </div>
                        </section>

                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Items
                            </h2>

                            <div className="mt-3 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/40 text-left">
                                        <tr>
                                            <th className="px-3 py-2 font-medium">
                                                Product
                                            </th>
                                            <th className="px-3 py-2 font-medium">
                                                Qty
                                            </th>
                                            <th className="px-3 py-2 font-medium">
                                                Unit
                                            </th>
                                            <th className="px-3 py-2 font-medium">
                                                Line
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {order.items.length === 0 ? (
                                            <tr>
                                                <td
                                                    className="px-3 py-6 text-center text-muted-foreground"
                                                    colSpan={4}
                                                >
                                                    No line items.
                                                </td>
                                            </tr>
                                        ) : (
                                            order.items.map((item) => (
                                                <tr
                                                    key={item.id}
                                                    className="border-b last:border-b-0"
                                                >
                                                    <td className="px-3 py-2">
                                                        <div className="font-medium">
                                                            {item.product_name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {item.product_sku ??
                                                                '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        {formatMoney(
                                                            item.unit_price,
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 font-medium">
                                                        {formatMoney(
                                                            item.line_total,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-4">
                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Update Status
                            </h2>

                            <form
                                className="mt-3 space-y-3"
                                onSubmit={(event) => {
                                    event.preventDefault();

                                    form.patch(
                                        ordersUpdateStatus(order.public_id).url,
                                        {
                                            preserveScroll: true,
                                        },
                                    );
                                }}
                            >
                                <select
                                    value={form.data.status}
                                    onChange={(event) =>
                                        form.setData(
                                            'status',
                                            event.target
                                                .value as OrderDetails['status'],
                                        )
                                    }
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                                >
                                    {allowedStatuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>

                                {form.errors.status && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.status}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {form.processing
                                        ? 'Updating...'
                                        : 'Update Status'}
                                </button>
                            </form>
                        </section>

                        <section className="rounded-lg border bg-card p-4">
                            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                Totals
                            </h2>

                            <dl className="mt-3 space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">
                                        Subtotal
                                    </dt>
                                    <dd>{formatMoney(order.subtotal)}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">
                                        Shipping
                                    </dt>
                                    <dd>
                                        {formatMoney(order.shipping_total)}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="text-muted-foreground">Tax</dt>
                                    <dd>{formatMoney(order.tax_total)}</dd>
                                </div>
                                <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
                                    <dt>Total</dt>
                                    <dd>{formatMoney(order.total)}</dd>
                                </div>
                            </dl>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
