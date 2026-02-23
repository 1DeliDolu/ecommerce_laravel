import { Head, Link } from '@inertiajs/react';
import React from 'react';

import MarketingLayout from '@/layouts/marketing-layout';

type Category = {
    id: number;
    name: string;
    slug: string;
};

type ProductImage = {
    id: number;
    product_id: number;
    disk: string;
    path: string;
    alt: string | null;
    sort_order: number;
    is_primary: boolean;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    compare_at_price: string | null;
    stock: number;
    categories: Category[];
    images: ProductImage[];
    primary_image: ProductImage | null;
};

type Props = {
    product: Product;
};

function formatMoney(value: string | number) {
    const n = typeof value === 'string' ? Number(value) : value;
    return n.toFixed(2);
}

export default function Show({ product }: Props) {
    const images = product.images
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order);

    const primary =
        images.find((i) => i.is_primary) ??
        images[0] ??
        product.primary_image ??
        null;

    return (
        <MarketingLayout>
            <Head title={product.name} />

            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <Link
                        href="/products"
                        className="text-sm text-[#1b1b18]/70 hover:underline dark:text-[#EDEDEC]/70"
                    >
                        ← Back to Shop
                    </Link>

                    <div className="text-xs text-[#1b1b18]/60 dark:text-[#EDEDEC]/60">
                        {product.slug}
                    </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                    {/* Media */}
                    <div className="rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0a]/40">
                        <div className="aspect-square w-full rounded-md border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />

                        <div className="mt-4 flex flex-wrap gap-2">
                            {images.length === 0 ? (
                                <span className="text-xs text-[#1b1b18]/60 dark:text-[#EDEDEC]/60">
                                    No images.
                                </span>
                            ) : (
                                images.map((img) => (
                                    <div
                                        key={img.id}
                                        className={[
                                            'h-14 w-14 rounded-md border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5',
                                            img.is_primary
                                                ? 'ring-2 ring-black/10 dark:ring-white/10'
                                                : '',
                                        ].join(' ')}
                                        title={img.alt ?? img.path}
                                    />
                                ))
                            )}
                        </div>

                        {primary ? (
                            <div className="mt-4 rounded-md border border-black/10 bg-white p-3 text-xs text-[#1b1b18]/70 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-[#EDEDEC]/70">
                                <div className="font-medium text-[#1b1b18] dark:text-[#EDEDEC]">
                                    Primary image path
                                </div>
                                <div className="mt-1 break-all">
                                    {primary.path}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Details */}
                    <div className="rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0a]/40">
                        <h1 className="text-2xl font-semibold tracking-tight text-[#1b1b18] dark:text-[#EDEDEC]">
                            {product.name}
                        </h1>

                        <div className="mt-2 flex flex-wrap gap-1">
                            {product.categories.map((c) => (
                                <span
                                    key={c.id}
                                    className="rounded bg-black/5 px-2 py-0.5 text-[11px] text-[#1b1b18]/80 dark:bg-white/5 dark:text-[#EDEDEC]/80"
                                    title={c.slug}
                                >
                                    {c.name}
                                </span>
                            ))}
                        </div>

                        <div className="mt-4 flex items-end gap-3">
                            <div className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                                €{formatMoney(product.price)}
                            </div>
                            {product.compare_at_price ? (
                                <div className="text-sm text-[#1b1b18]/60 line-through dark:text-[#EDEDEC]/60">
                                    €{formatMoney(product.compare_at_price)}
                                </div>
                            ) : null}
                        </div>

                        <div className="mt-2 text-sm text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                            {product.stock > 0
                                ? `${product.stock} in stock`
                                : 'Out of stock'}
                        </div>

                        <div className="mt-6">
                            <div className="text-xs font-medium text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                                Description
                            </div>
                            <div className="mt-2 rounded-md border border-black/10 bg-white p-3 text-sm whitespace-pre-wrap text-[#1b1b18] dark:border-white/10 dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                                {product.description
                                    ? product.description
                                    : '—'}
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                            <button
                                type="button"
                                disabled={product.stock <= 0}
                                className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-medium text-white opacity-90 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
                            >
                                Add to cart (next)
                            </button>

                            <Link
                                href="/products"
                                className="inline-flex items-center justify-center rounded-md border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:bg-[#0a0a0a] dark:hover:bg-white/5"
                            >
                                Continue shopping
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
