import { Head, Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { TierBadge } from '@/components/ui/tier-badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { usePage } from '@inertiajs/react';

type Order = {
    id: number;
    public_id: string;
    status: string;
    email: string;
    total: string;
    created_at: string;
    items?: Array<{
        id: number;
        name: string;
        qty: number;
    }>;
};

type Props = {
    orders: Order[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: '/account/orders' },
];

export default function OrdersIndex({ orders }: Props) {
    const { props } = usePage();
    const tier = props.auth?.tier;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Orders</h1>
                    {tier && <TierBadge tier={tier} />}
                </div>

                {orders.length === 0 ? (
                    <div className="flex h-[40vh] items-center justify-center rounded-xl border border-dashed">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No orders yet.{' '}
                            <Link
                                href="/products"
                                className="font-medium text-gray-900 hover:underline dark:text-white"
                            >
                                Start shopping
                            </Link>
                        </p>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-xl border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order #</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-sm">
                                            {order.public_id}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {new Date(
                                                order.created_at,
                                            ).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-sm capitalize">
                                            {order.status}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            €{order.total}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                asChild
                                                size="sm"
                                                variant="ghost"
                                            >
                                                <a
                                                    href={`/account/invoices/${order.public_id}`}
                                                    download
                                                >
                                                    PDF
                                                </a>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
