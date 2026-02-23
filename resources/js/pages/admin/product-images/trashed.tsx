import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { forceDestroy, restore } from '@/routes/admin/product-images';
import type { BreadcrumbItem } from '@/types';

type Product = {
    id: number;
    name: string;
    slug: string;
};

type ProductImage = {
    id: number;
    product_id: number;
    path: string;
    alt: string | null;
    sort_order: number;
    is_primary: boolean;
    url: string;
    deleted_at: string;
    product: Product;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginationLink[];
};

type Props = {
    images: Paginator<ProductImage>;
    filters: { q: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Trashed Images', href: '/admin/product-images/trashed' },
];

function stripLabel(label: string) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/<[^>]*>/g, '')
        .trim();
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function TrashedImages({ images, filters }: Props) {
    const [q, setQ] = useState(filters.q ?? '');

    // Debounced search
    useEffect(() => {
        const handle = window.setTimeout(() => {
            router.get(
                '/admin/product-images/trashed',
                { q: q || '' },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(handle);
    }, [q]);

    // Keep local state in sync with server-driven navigation
    useEffect(() => {
        setQ(filters.q ?? '');
    }, [filters.q]);

    const handleRestore = (image: ProductImage) => {
        router.patch(restore.url(image.id), {}, { preserveScroll: true });
    };

    const handleForceDelete = (image: ProductImage) => {
        if (
            !window.confirm(
                `Permanently delete this image? This cannot be undone.`,
            )
        ) {
            return;
        }
        router.delete(forceDestroy.url(image.id), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trashed Images" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Trashed Images
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Soft-deleted product images. Restore or permanently
                            delete them.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            {images.data.length > 0
                                ? `${images.data.length} image${images.data.length !== 1 ? 's' : ''} shown`
                                : 'No trashed images found'}
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* Search */}
                        <div className="max-w-sm">
                            <Input
                                placeholder="Search by product name…"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </div>

                        {/* Table */}
                        {images.data.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                {q
                                    ? 'No images match your search.'
                                    : 'No trashed images.'}
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            <th className="px-4 py-3">Image</th>
                                            <th className="px-4 py-3">
                                                Product
                                            </th>
                                            <th className="px-4 py-3">Alt</th>
                                            <th className="px-4 py-3">
                                                Deleted
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {images.data.map((image) => (
                                            <tr
                                                key={image.id}
                                                className="hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <img
                                                        src={image.url}
                                                        alt={image.alt ?? ''}
                                                        className="h-14 w-14 rounded-md object-cover grayscale"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Link
                                                        href={`/admin/products/${image.product.slug}/edit`}
                                                        className="font-medium text-blue-600 hover:underline"
                                                    >
                                                        {image.product.name}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {image.alt ?? (
                                                        <span className="italic">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {formatDate(
                                                        image.deleted_at,
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="border-green-600 text-green-700 hover:bg-green-50"
                                                            onClick={() =>
                                                                handleRestore(
                                                                    image,
                                                                )
                                                            }
                                                        >
                                                            Restore
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleForceDelete(
                                                                    image,
                                                                )
                                                            }
                                                        >
                                                            Delete forever
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {images.links.length > 3 && (
                            <div className="flex flex-wrap gap-1 pt-2">
                                {images.links.map((link, i) => {
                                    const label = stripLabel(link.label);
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={i}
                                                className="rounded-md px-3 py-1 text-sm text-muted-foreground"
                                                dangerouslySetInnerHTML={{
                                                    __html: label,
                                                }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                                                link.active
                                                    ? 'bg-gray-900 text-white'
                                                    : 'border border-gray-200 text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: label,
                                                }}
                                            />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
