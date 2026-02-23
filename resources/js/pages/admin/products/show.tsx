import { Head, Link } from '@inertiajs/react';
import React from 'react';

import AppLayout from '@/layouts/app-layout';

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
    sku: string | null;
    description: string | null;
    price: string;
    compare_at_price: string | null;
    stock: number;
    is_active: boolean;
    categories: Category[];
    images: ProductImage[];
};

type Props = {
    product: Product;
};

function formatMoney(value: string | number) {
    const n = typeof value === 'string' ? Number(value) : value;
    return n.toFixed(2);
}

export default function Show({ product }: Props) {
    const primary =
        product.images.find((i) => i.is_primary) ?? product.images[0] ?? null;

    return (
        <AppLayout>
            <Head title={product.name} />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {product.name}
                            </h1>
                            {product.is_active ? (
                                <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700">
                                    Active
                                </span>
                            ) : (
                                <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                    Inactive
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {product.slug}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/products/${product.slug}/edit`}
                            className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                            Edit
                        </Link>

                        <Link
                            href="/admin/products"
                            className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                            Back
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Media */}
                    <div className="rounded-lg border bg-card p-4 lg:col-span-1">
                        <h2 className="text-sm font-medium">Images</h2>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Upload flow will be added later. For now, images are
                            seeded as paths.
                        </p>

                        <div className="mt-4 space-y-3">
                            <div className="aspect-square w-full rounded-md border bg-muted/30" />
                            <div className="flex flex-wrap gap-2">
                                {product.images.length === 0 ? (
                                    <span className="text-xs text-muted-foreground">
                                        No images.
                                    </span>
                                ) : (
                                    product.images
                                        .slice()
                                        .sort(
                                            (a, b) =>
                                                a.sort_order - b.sort_order,
                                        )
                                        .map((img) => (
                                            <div
                                                key={img.id}
                                                className={[
                                                    'h-12 w-12 rounded-md border bg-muted/30',
                                                    img.is_primary
                                                        ? 'ring-2 ring-ring'
                                                        : '',
                                                ].join(' ')}
                                                title={img.alt ?? img.path}
                                            />
                                        ))
                                )}
                            </div>

                            {primary ? (
                                <div className="rounded-md border bg-background p-3 text-xs text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                        <span>Primary</span>
                                        <span className="font-medium text-foreground">
                                            #{primary.id}
                                        </span>
                                    </div>
                                    <div className="mt-2 break-all">
                                        <span className="font-medium text-foreground">
                                            Path:
                                        </span>{' '}
                                        {primary.path}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="rounded-lg border bg-card p-4 lg:col-span-2">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Price
                                </div>
                                <div className="mt-1 text-base font-medium">
                                    {formatMoney(product.price)}
                                </div>
                                {product.compare_at_price ? (
                                    <div className="text-xs text-muted-foreground line-through">
                                        {formatMoney(product.compare_at_price)}
                                    </div>
                                ) : null}
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Stock
                                </div>
                                <div className="mt-1 text-base font-medium">
                                    {product.stock > 0
                                        ? product.stock
                                        : 'Out of stock'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    SKU
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {product.sku ?? '—'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Categories
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {product.categories.length ? (
                                        product.categories.map((c) => (
                                            <span
                                                key={c.id}
                                                className="rounded bg-muted px-2 py-1 text-xs"
                                            >
                                                {c.name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="text-xs text-muted-foreground">
                                Description
                            </div>
                            <div className="mt-2 rounded-md border bg-background p-3 text-sm whitespace-pre-wrap">
                                {product.description
                                    ? product.description
                                    : '—'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
