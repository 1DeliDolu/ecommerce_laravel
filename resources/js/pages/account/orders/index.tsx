import { Head } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: '/account/orders' },
];

export default function OrdersIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Orders" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Orders</h1>
                </div>

                <div className="relative min-h-[40vh] flex-1 overflow-hidden rounded-xl border border-dashed">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-black/10 dark:stroke-white/10" />
                </div>
            </div>
        </AppLayout>
    );
}
