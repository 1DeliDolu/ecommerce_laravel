import { Head, Link } from '@inertiajs/react';

import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Address = {
    full_name: string;
    address1: string;
    address2: string | null;
    city: string;
    postal_code: string;
    country: string;
    order_count: number;
    last_used_at: string;
};

type Props = {
    addresses: Address[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Addresses', href: '/account/addresses' },
];

export default function AddressesIndex({ addresses }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Addresses" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        Shipping Addresses
                    </h1>
                </div>

                <p className="text-sm text-muted-foreground">
                    These are the shipping addresses you've used on previous
                    orders.
                </p>

                {addresses.length === 0 ? (
                    <div className="flex h-[40vh] items-center justify-center rounded-xl border border-dashed">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No addresses yet.{' '}
                            <Link
                                href="/products"
                                className="font-medium text-gray-900 hover:underline dark:text-white"
                            >
                                Place your first order
                            </Link>{' '}
                            to save an address.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {addresses.map((addr, i) => (
                            <Card key={i}>
                                <CardContent className="pt-6">
                                    <p className="font-medium">
                                        {addr.full_name}
                                    </p>
                                    <p className="text-sm">{addr.address1}</p>
                                    {addr.address2 && (
                                        <p className="text-sm">
                                            {addr.address2}
                                        </p>
                                    )}
                                    <p className="text-sm">
                                        {addr.city}, {addr.postal_code}
                                    </p>
                                    <p className="text-sm">{addr.country}</p>

                                    <p className="mt-3 text-xs text-muted-foreground">
                                        Used in {addr.order_count}{' '}
                                        {addr.order_count === 1
                                            ? 'order'
                                            : 'orders'}{' '}
                                        &middot; Last used{' '}
                                        {new Date(
                                            addr.last_used_at,
                                        ).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
