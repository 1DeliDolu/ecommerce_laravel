import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import MarketingLayout from '@/layouts/marketing-layout';

type OrderItem = {
    name: string;
    slug: string | null;
    qty: number;
    unit_price: string;
    line_total: string;
};

type Order = {
    public_id: string;
    status: string;
    email: string;
    created_at: string | null;

    currency: string;
    subtotal: string;
    tax: string;
    shipping: string;
    total: string;

    items: OrderItem[];
};

type Props = {
    order: Order;
};

export default function CheckoutSuccess({ order }: Props) {
    useEffect(() => {
        const timer = window.setTimeout(() => {
            router.visit('/', { replace: true });
        }, 1000);

        return () => window.clearTimeout(timer);
    }, []);
    return (
        <MarketingLayout>
            <Head title="Order confirmed" />

            <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                            Order confirmed
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            We sent a confirmation to{' '}
                            <span className="font-medium">{order.email}</span>.
                        </p>
                    </div>

                    <Link
                        href="/products"
                        className="text-sm text-gray-600 hover:underline dark:text-gray-300"
                    >
                        Continue shopping &rarr;
                    </Link>
                </div>

                <div className="mt-8 grid gap-6">
                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Order details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Reference
                                </span>
                                <span className="font-mono text-gray-900 dark:text-white">
                                    {order.public_id}
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-gray-600 dark:text-gray-300">
                                    Status
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {order.status}
                                </span>
                            </div>

                            {order.created_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Created
                                    </span>
                                    <span className="text-gray-900 dark:text-white">
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl">
                        <CardHeader>
                            <CardTitle className="text-lg">Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                                {order.items.map((item, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start justify-between py-4 text-sm"
                                    >
                                        <div className="min-w-0">
                                            {item.slug ? (
                                                <Link
                                                    href={`/products/${item.slug}`}
                                                    className="font-medium text-gray-900 hover:underline dark:text-white"
                                                >
                                                    {item.name}
                                                </Link>
                                            ) : (
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {item.name}
                                                </span>
                                            )}
                                            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                {item.unit_price} × {item.qty}
                                            </div>
                                        </div>

                                        <div className="ml-6 font-medium whitespace-nowrap text-gray-900 dark:text-white">
                                            {order.currency} {item.line_total}
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <Separator />

                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Subtotal
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {order.currency} {order.subtotal}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Shipping
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {order.currency} {order.shipping}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600 dark:text-gray-300">
                                        Tax
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {order.currency} {order.tax}
                                    </span>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between text-base">
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        Total
                                    </span>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        {order.currency} {order.total}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Link
                                    href="/cart"
                                    className="text-sm text-gray-600 hover:underline dark:text-gray-300"
                                >
                                    View cart
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MarketingLayout>
    );
}
