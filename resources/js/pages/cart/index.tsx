import { Head, Link } from '@inertiajs/react';

import MarketingLayout from '@/layouts/marketing-layout';

type CartItem = {
    product_id: number;
    name: string;
    slug: string;
    unit_price_cents: number;
    unit_price: string;
    qty: number;
    line_total_cents: number;
    line_total: string;
};

type CartSummary = {
    items_count: number;
    unique_items_count: number;
    subtotal_cents: number;
    subtotal: string;
};

type Props = {
    cart: {
        items: CartItem[];
        summary: CartSummary;
    };
};

export default function CartIndex({ cart }: Props) {
    return (
        <MarketingLayout>
            <Head title="Your Cart" />

            <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                <h1 className="mb-8 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Your Cart
                </h1>

                {cart.items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400">
                            Your cart is empty.
                        </p>
                        <Link
                            href="/products"
                            className="mt-4 inline-flex items-center text-sm font-medium text-gray-900 underline-offset-2 hover:underline dark:text-white"
                        >
                            Continue shopping &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                            {cart.items.map((item) => (
                                <li
                                    key={item.product_id}
                                    className="flex items-center gap-4 py-4"
                                >
                                    <div className="flex-1">
                                        <Link
                                            href={`/products/${item.slug}`}
                                            className="font-medium text-gray-900 hover:underline dark:text-white"
                                        >
                                            {item.name}
                                        </Link>
                                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                                            {item.unit_price} &times; {item.qty}
                                        </p>
                                    </div>
                                    <span className="font-semibold text-gray-900 dark:text-white">
                                        ${item.line_total}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                            <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-white">
                                <span>
                                    Subtotal ({cart.summary.items_count} items)
                                </span>
                                <span>${cart.summary.subtotal}</span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href="/products"
                                className="text-sm text-gray-500 hover:underline dark:text-gray-400"
                            >
                                &larr; Continue shopping
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
