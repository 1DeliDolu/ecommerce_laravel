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
    brand: string | null;
    model_name: string | null;
    product_type: string | null;
    color: string | null;
    material: string | null;
    available_clothing_sizes: string[] | null;
    available_shoe_sizes: string[] | null;
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

function resolveImageUrl(image: ProductImage | null): string | null {
    if (!image || image.path.trim() === '') {
        return null;
    }

    if (image.path.startsWith('http://') || image.path.startsWith('https://')) {
        return image.path;
    }

    if (image.path.startsWith('/')) {
        return image.path;
    }

    if (image.disk === 'public' || image.disk.trim() === '') {
        return `/storage/${image.path.replace(/^\/+/, '')}`;
    }

    return null;
}

export default function Show({ product }: Props) {
    const primary =
        product.images.find((i) => i.is_primary) ?? product.images[0] ?? null;
    const primaryImageUrl = resolveImageUrl(primary);

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
                            <div className="aspect-square w-full overflow-hidden rounded-md border bg-muted/30">
                                {primaryImageUrl ? (
                                    <img
                                        src={primaryImageUrl}
                                        alt={primary?.alt ?? product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : null}
                            </div>
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
                                        .map((img) => {
                                            const imageUrl = resolveImageUrl(img);

                                            return (
                                                <div
                                                    key={img.id}
                                                    className={[
                                                        'h-12 w-12 overflow-hidden rounded-md border bg-muted/30',
                                                        img.is_primary
                                                            ? 'ring-2 ring-ring'
                                                            : '',
                                                    ].join(' ')}
                                                    title={img.alt ?? img.path}
                                                >
                                                    {imageUrl ? (
                                                        <img
                                                            src={imageUrl}
                                                            alt={img.alt ?? product.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : null}
                                                </div>
                                            );
                                        })
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

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Brand / Model
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {product.brand ?? '—'} / {product.model_name ?? '—'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Type / Color
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {product.product_type ?? '—'} / {product.color ?? '—'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Material
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {product.material ?? '—'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Clothing sizes
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {(product.available_clothing_sizes ?? []).join(', ') || '—'}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs text-muted-foreground">
                                    Shoe sizes
                                </div>
                                <div className="mt-1 text-sm font-medium">
                                    {(product.available_shoe_sizes ?? []).join(', ') || '—'}
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
