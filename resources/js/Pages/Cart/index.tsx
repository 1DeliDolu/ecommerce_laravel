import { Head, Link, router } from '@inertiajs/react';
import React from 'react';

type CartItem = {
    product_id: number;
    name: string;
    slug: string;
    unit_price: string;
    unit_price_cents: number;
    qty: number;
    line_total: string;
    line_total_cents: number;
};

type CartSummary = {
    items_count: number;
    unique_items_count: number;
    subtotal: string;
    subtotal_cents: number;
};

type PageProps = {
    cart: {
        items: CartItem[];
        summary: CartSummary;
    };
};

export default function CartIndex({ cart }: PageProps) {
    const items = cart?.items ?? [];
    const summary = cart?.summary ?? {
        items_count: 0,
        unique_items_count: 0,
        subtotal: '0.00',
        subtotal_cents: 0,
    };

    const [qtyByProductId, setQtyByProductId] = React.useState<
        Record<number, number>
    >(() => {
        const initial: Record<number, number> = {};
        for (const item of items) initial[item.product_id] = item.qty;
        return initial;
    });

    React.useEffect(() => {
        const next: Record<number, number> = {};
        for (const item of items) next[item.product_id] = item.qty;
        setQtyByProductId(next);
    }, [items.length]);

    const updateQty = (productId: number) => {
        const qty = qtyByProductId[productId] ?? 1;

        router.patch(
            `/cart/${productId}`,
            { qty },
            {
                preserveScroll: true,
            },
        );
    };

    const removeItem = (productId: number) => {
        router.delete(`/cart/${productId}`, {
            preserveScroll: true,
        });
    };

    const clearCart = () => {
        router.delete(`/cart`, {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Cart" />

            <div className="mx-auto w-full max-w-5xl px-4 py-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Cart</h1>
                        <p className="text-sm text-gray-600">
                            {summary.items_count} items ·{' '}
                            {summary.unique_items_count} unique
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/products"
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                        >
                            Continue shopping
                        </Link>

                        <button
                            type="button"
                            onClick={clearCart}
                            disabled={items.length === 0}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Clear cart
                        </button>
                    </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {items.length === 0 ? (
                        <div className="p-6">
                            <p className="text-gray-700">Your cart is empty.</p>
                            <Link
                                href="/products"
                                className="mt-3 inline-block text-sm text-blue-600 hover:underline"
                            >
                                Browse products
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-gray-200 bg-gray-50 text-gray-700">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3">
                                            Unit price
                                        </th>
                                        <th className="px-4 py-3">Qty</th>
                                        <th className="px-4 py-3">
                                            Line total
                                        </th>
                                        <th className="px-4 py-3"></th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-200">
                                    {items.map((item) => (
                                        <tr key={item.product_id}>
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <Link
                                                        href={`/products/${item.slug}`}
                                                        className="font-medium text-gray-900 hover:underline"
                                                    >
                                                        {item.name}
                                                    </Link>
                                                    <span className="text-xs text-gray-500">
                                                        #{item.product_id}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-gray-900 tabular-nums">
                                                {item.unit_price}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={99}
                                                        value={
                                                            qtyByProductId[
                                                                item.product_id
                                                            ] ?? item.qty
                                                        }
                                                        onChange={(e) =>
                                                            setQtyByProductId(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [item.product_id]:
                                                                        Number(
                                                                            e
                                                                                .target
                                                                                .value,
                                                                        ),
                                                                }),
                                                            )
                                                        }
                                                        className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateQty(
                                                                item.product_id,
                                                            )
                                                        }
                                                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                                                    >
                                                        Update
                                                    </button>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 font-medium text-gray-900 tabular-nums">
                                                {item.line_total}
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeItem(
                                                            item.product_id,
                                                        )
                                                    }
                                                    className="rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                <tfoot className="border-t border-gray-200 bg-gray-50">
                                    <tr>
                                        <td className="px-4 py-4" colSpan={3}>
                                            <span className="text-sm text-gray-700">
                                                Subtotal
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-base font-semibold text-gray-900 tabular-nums">
                                            {summary.subtotal}
                                        </td>
                                        <td className="px-4 py-4"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
