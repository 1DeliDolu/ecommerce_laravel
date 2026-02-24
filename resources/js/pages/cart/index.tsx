import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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

    // Eğer backend gönderirse gösteririz (yoksa placeholder)
    image_url?: string | null;
    image_alt?: string | null;
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

function formatMoneyFromCents(cents: number) {
    const value = Math.round(cents) / 100;
    return value.toFixed(2);
}

export default function CartIndex({ cart }: Props) {
    const [qtyByProduct, setQtyByProduct] = useState<Record<number, number>>(
        {},
    );

    const shippingCents = 500; // UI için (ileride backend hesaplayacak)
    const taxRate = 0.084; // UI için (ileride backend hesaplayacak)

    const taxCents = useMemo(() => {
        const computed = Math.round(cart.summary.subtotal_cents * taxRate);
        return Number.isFinite(computed) ? computed : 0;
    }, [cart.summary.subtotal_cents]);

    const orderTotalCents =
        cart.summary.subtotal_cents + shippingCents + taxCents;

    const onQtyChange = (productId: number, nextQty: number) => {
        setQtyByProduct((prev) => ({ ...prev, [productId]: nextQty }));

        // Not: Endpoint'ler sende farklıysa sadece URL'leri değiştir.
        router.patch(
            `/cart/items/${productId}`,
            { qty: nextQty },
            { preserveScroll: true, preserveState: true },
        );
    };

    const onRemove = (productId: number) => {
        // Not: Endpoint'ler sende farklıysa sadece URL'leri değiştir.
        router.delete(`/cart/items/${productId}`, { preserveScroll: true });
    };

    return (
        <MarketingLayout>
            <Head title="Shopping Cart" />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Shopping Cart
                </h1>

                {cart.items.length === 0 ? (
                    <div className="mt-10 rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-700">
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
                    <div className="mt-10 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12">
                        {/* LEFT: Items */}
                        <section className="lg:col-span-7">
                            <ul
                                role="list"
                                className="divide-y divide-gray-200 border-t border-gray-200 dark:divide-gray-800 dark:border-gray-800"
                            >
                                {cart.items.map((item) => {
                                    const qty =
                                        qtyByProduct[item.product_id] ??
                                        item.qty;

                                    return (
                                        <li
                                            key={item.product_id}
                                            className="flex py-8"
                                        >
                                            <div className="h-28 w-28 flex-none overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={
                                                            item.image_alt ??
                                                            item.name
                                                        }
                                                        className="h-full w-full object-cover object-center"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full" />
                                                )}
                                            </div>

                                            <div className="ml-6 flex flex-1 flex-col">
                                                <div className="flex items-start justify-between gap-6">
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/products/${item.slug}`}
                                                            className="text-base font-semibold text-gray-900 hover:underline dark:text-white"
                                                        >
                                                            {item.name}
                                                        </Link>

                                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                            ${item.unit_price}
                                                        </p>

                                                        <div className="mt-4 flex items-center gap-2 text-sm">
                                                            <span className="inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                                                In stock
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <label
                                                                className="sr-only"
                                                                htmlFor={`qty-${item.product_id}`}
                                                            >
                                                                Quantity
                                                            </label>
                                                            <select
                                                                id={`qty-${item.product_id}`}
                                                                value={qty}
                                                                onChange={(e) =>
                                                                    onQtyChange(
                                                                        item.product_id,
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                    )
                                                                }
                                                                className="h-10 w-24 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-gray-900/20 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                                            >
                                                                {Array.from({
                                                                    length: 10,
                                                                }).map(
                                                                    (_, i) => {
                                                                        const v =
                                                                            i +
                                                                            1;
                                                                        return (
                                                                            <option
                                                                                key={
                                                                                    v
                                                                                }
                                                                                value={
                                                                                    v
                                                                                }
                                                                            >
                                                                                {
                                                                                    v
                                                                                }
                                                                            </option>
                                                                        );
                                                                    },
                                                                )}
                                                            </select>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    onRemove(
                                                                        item.product_id,
                                                                    )
                                                                }
                                                                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-900 dark:hover:text-gray-300"
                                                                aria-label="Remove"
                                                                title="Remove"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-end justify-between">
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        ${item.unit_price} ×{' '}
                                                        {qty}
                                                    </p>
                                                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                                                        ${item.line_total}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="mt-6">
                                <Link
                                    href="/products"
                                    className="text-sm text-gray-600 hover:underline dark:text-gray-300"
                                >
                                    &larr; Continue shopping
                                </Link>
                            </div>
                        </section>

                        {/* RIGHT: Summary */}
                        <aside className="mt-10 lg:col-span-5 lg:mt-0">
                            <div className="rounded-2xl bg-gray-50 p-6 shadow-sm ring-1 ring-gray-200 dark:bg-gray-950 dark:ring-gray-800">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Order summary
                                </h2>

                                <dl className="mt-6 space-y-4 text-sm">
                                    <div className="flex items-center justify-between">
                                        <dt className="text-gray-600 dark:text-gray-300">
                                            Subtotal
                                        </dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">
                                            $
                                            {formatMoneyFromCents(
                                                cart.summary.subtotal_cents,
                                            )}
                                        </dd>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                                        <dt className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            Shipping estimate
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                ?
                                            </span>
                                        </dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">
                                            $
                                            {formatMoneyFromCents(
                                                shippingCents,
                                            )}
                                        </dd>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                                        <dt className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                            Tax estimate
                                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                                                ?
                                            </span>
                                        </dt>
                                        <dd className="font-medium text-gray-900 dark:text-white">
                                            ${formatMoneyFromCents(taxCents)}
                                        </dd>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                                        <dt className="text-base font-semibold text-gray-900 dark:text-white">
                                            Order total
                                        </dt>
                                        <dd className="text-base font-semibold text-gray-900 dark:text-white">
                                            $
                                            {formatMoneyFromCents(
                                                orderTotalCents,
                                            )}
                                        </dd>
                                    </div>
                                </dl>

                                <div className="mt-6">
                                    <Link
                                        href="/checkout"
                                        className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700"
                                    >
                                        Checkout
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
