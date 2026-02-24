import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import {
    forceDelete as forceDeleteProductImage,
    restore as restoreProductImage,
    trashed,
} from '@/routes/admin/product-images';
import type { BreadcrumbItem } from '@/types';

type ProductSummary = {
    id: number;
    name: string;
    slug: string;
} | null;

type TrashedImage = {
    id: number;
    path: string;
    alt: string | null;
    is_primary: boolean;
    sort_order: number;
    deleted_at: string | null;
    product: ProductSummary;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginationLink[];
    meta?: {
        from: number | null;
        to: number | null;
        total: number;
    };
};

type Props = {
    images: Paginator<TrashedImage>;
    filters: {
        q: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Trashed Images', href: trashed.url() },
];

function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim();
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    return new Date(value).toLocaleString();
}

export default function AdminTrashedProductImages({ images, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    useEffect(() => {
        const timer = window.setTimeout(() => {
            router.get(
                trashed().url,
                { q },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(timer);
    }, [q]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trashed Images" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Trashed Images
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Restore soft deleted product images or permanently
                        remove them.
                    </p>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="flex-1">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Search
                            </label>
                            <input
                                value={q}
                                onChange={(event) => setQ(event.target.value)}
                                placeholder="Path, alt text, product name or slug"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setQ('');
                                    router.get(
                                        trashed().url,
                                        { q: '' },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                            replace: true,
                                        },
                                    );
                                }}
                                className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Image
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Primary
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Deleted At
                                    </th>
                                    <th className="px-4 py-3 font-medium" />
                                </tr>
                            </thead>

                            <tbody>
                                {images.data.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-4 py-8 text-center text-muted-foreground"
                                            colSpan={5}
                                        >
                                            No trashed images found.
                                        </td>
                                    </tr>
                                ) : (
                                    images.data.map((image) => (
                                        <tr
                                            key={image.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                {image.product ? (
                                                    <div className="space-y-0.5">
                                                        <div className="font-medium">
                                                            {
                                                                image.product
                                                                    .name
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {
                                                                image.product
                                                                    .slug
                                                            }
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        Product removed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {image.path}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {image.alt ?? '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {image.is_primary
                                                    ? 'Yes'
                                                    : 'No'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {formatDate(image.deleted_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            router.patch(
                                                                restoreProductImage(
                                                                    image.id,
                                                                ).url,
                                                                {},
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                },
                                                            );
                                                        }}
                                                        className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                                    >
                                                        Restore
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const confirmed =
                                                                window.confirm(
                                                                    'Permanently delete this image? This action cannot be undone.',
                                                                );

                                                            if (!confirmed) {
                                                                return;
                                                            }

                                                            router.delete(
                                                                forceDeleteProductImage(
                                                                    image.id,
                                                                ).url,
                                                                {
                                                                    preserveScroll:
                                                                        true,
                                                                },
                                                            );
                                                        }}
                                                        className="rounded-md border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                                                    >
                                                        Delete Permanently
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-muted-foreground">
                            {images.meta?.from != null &&
                            images.meta?.to != null ? (
                                <>
                                    Showing{' '}
                                    <span className="font-medium">
                                        {images.meta.from}
                                    </span>
                                    -{' '}
                                    <span className="font-medium">
                                        {images.meta.to}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">
                                        {images.meta.total}
                                    </span>
                                </>
                            ) : (
                                <>
                                    Showing{' '}
                                    <span className="font-medium">
                                        {images.data.length}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                            {images.links.map((link, index) => {
                                const label = stripHtml(link.label);

                                if (!link.url) {
                                    return (
                                        <span
                                            key={`${label}-${index}`}
                                            className="cursor-not-allowed rounded-md border px-3 py-1.5 text-xs text-muted-foreground opacity-60"
                                        >
                                            {label}
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={`${label}-${index}`}
                                        href={link.url}
                                        preserveScroll
                                        className={[
                                            'rounded-md border px-3 py-1.5 text-xs',
                                            link.active
                                                ? 'bg-accent font-medium'
                                                : 'bg-background hover:bg-accent',
                                        ].join(' ')}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
