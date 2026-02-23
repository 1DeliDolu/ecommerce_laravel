import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Category = {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
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
    price: string; // casted as decimal:2 on backend, comes as string
    compare_at_price: string | null;
    stock: number;
    is_active: boolean;
    images_count: number;
    categories: Pick<Category, 'id' | 'name' | 'slug'>[];
    primary_image: ProductImage | null;
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
        current_page: number;
        from: number | null;
        to: number | null;
        total: number;
        per_page: number;
        last_page: number;
    };
};

type Filters = {
    q: string;
    status: 'all' | 'active' | 'inactive';
    category: string; // category slug
    stock: 'all' | 'in' | 'out';
};

type Props = {
    products: Paginator<Product>;
    categories: Category[];
    filters: Filters;
};

function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim();
}

function buildQuery(filters: Filters) {
    return {
        q: filters.q || '',
        status: filters.status || 'all',
        category: filters.category || '',
        stock: filters.stock || 'all',
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Products', href: '/admin/products' },
];

export default function Index({ products, categories, filters }: Props) {
    const [local, setLocal] = useState<Filters>(filters);

    // Keep local state in sync when navigation happens (e.g. back/forward).
    useEffect(() => {
        setLocal(filters);
    }, [filters.q, filters.status, filters.category, filters.stock]);

    const categoryOptions = useMemo(() => {
        // Simple flat list; later we can render nested (parent/child).
        return categories.slice().sort((a, b) => a.name.localeCompare(b.name));
    }, [categories]);

    const applyFilters = (next: Filters) => {
        setLocal(next);

        router.get('/admin/products', buildQuery(next), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce only the search input; other filters apply instantly.
    useEffect(() => {
        const handle = window.setTimeout(() => {
            router.get('/admin/products', buildQuery(local), {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 350);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local.q]);

    const onDelete = (product: Product) => {
        const ok = window.confirm(
            `Delete "${product.name}"?\n\nThis will soft-delete the product and its images.`,
        );
        if (!ok) return;

        router.delete(`/admin/products/${product.slug}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Products
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage products, categories, stock, and images.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/products/create"
                            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
                        >
                            New Product
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-lg border bg-card p-4">
                    <div className="grid gap-3 md:grid-cols-4">
                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Search
                            </label>
                            <input
                                value={local.q}
                                onChange={(e) =>
                                    setLocal((p) => ({
                                        ...p,
                                        q: e.target.value,
                                    }))
                                }
                                placeholder="Name, slug or SKU…"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Status
                            </label>
                            <select
                                value={local.status}
                                onChange={(e) =>
                                    applyFilters({
                                        ...local,
                                        status: e.target
                                            .value as Filters['status'],
                                    })
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Stock
                            </label>
                            <select
                                value={local.stock}
                                onChange={(e) =>
                                    applyFilters({
                                        ...local,
                                        stock: e.target
                                            .value as Filters['stock'],
                                    })
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All</option>
                                <option value="in">In stock</option>
                                <option value="out">Out of stock</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Category
                            </label>
                            <select
                                value={local.category}
                                onChange={(e) =>
                                    applyFilters({
                                        ...local,
                                        category: e.target.value,
                                    })
                                }
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="">All categories</option>
                                {categoryOptions.map((c) => (
                                    <option key={c.id} value={c.slug}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-end gap-2 md:col-span-2">
                            <button
                                type="button"
                                onClick={() =>
                                    applyFilters({
                                        q: '',
                                        status: 'all',
                                        category: '',
                                        stock: 'all',
                                    })
                                }
                                className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-lg border bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b bg-muted/40 text-left">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Product
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        SKU
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Price
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Stock
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Categories
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Images
                                    </th>
                                    <th className="px-4 py-3 font-medium"></th>
                                </tr>
                            </thead>

                            <tbody>
                                {products.data.length === 0 ? (
                                    <tr>
                                        <td
                                            className="px-4 py-8 text-center text-muted-foreground"
                                            colSpan={8}
                                        >
                                            No products found.
                                        </td>
                                    </tr>
                                ) : (
                                    products.data.map((p) => (
                                        <tr
                                            key={p.id}
                                            className="border-b last:border-b-0"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 rounded-md border bg-muted/30" />
                                                    <div className="min-w-0">
                                                        <Link
                                                            href={`/admin/products/${p.slug}`}
                                                            className="block truncate font-medium hover:underline"
                                                        >
                                                            {p.name}
                                                        </Link>
                                                        <div className="truncate text-xs text-muted-foreground">
                                                            {p.slug}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                {p.sku ? (
                                                    <span className="rounded bg-muted px-2 py-1 text-xs">
                                                        {p.sku}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {Number(p.price).toFixed(2)}
                                                </div>
                                                {p.compare_at_price ? (
                                                    <div className="text-xs text-muted-foreground line-through">
                                                        {Number(
                                                            p.compare_at_price,
                                                        ).toFixed(2)}
                                                    </div>
                                                ) : null}
                                            </td>

                                            <td className="px-4 py-3">
                                                {p.stock > 0 ? (
                                                    <span className="font-medium">
                                                        {p.stock}
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-muted px-2 py-1 text-xs">
                                                        Out
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {p.is_active ? (
                                                    <span className="rounded bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700">
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                {p.categories.length ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {p.categories
                                                            .slice(0, 3)
                                                            .map((c) => (
                                                                <span
                                                                    key={c.id}
                                                                    className="rounded bg-muted px-2 py-1 text-xs"
                                                                    title={
                                                                        c.slug
                                                                    }
                                                                >
                                                                    {c.name}
                                                                </span>
                                                            ))}
                                                        {p.categories.length >
                                                        3 ? (
                                                            <span className="rounded bg-muted px-2 py-1 text-xs">
                                                                +
                                                                {p.categories
                                                                    .length - 3}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <span className="rounded bg-muted px-2 py-1 text-xs">
                                                    {p.images_count}
                                                </span>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/admin/products/${p.slug}/edit`}
                                                        className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onDelete(p)
                                                        }
                                                        className="rounded-md border border-destructive/30 bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-muted-foreground">
                            {products.meta?.from != null &&
                            products.meta?.to != null ? (
                                <>
                                    Showing{' '}
                                    <span className="font-medium">
                                        {products.meta.from}
                                    </span>
                                    –
                                    <span className="font-medium">
                                        {products.meta.to}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">
                                        {products.meta.total}
                                    </span>
                                </>
                            ) : (
                                <>
                                    Showing{' '}
                                    <span className="font-medium">
                                        {products.data.length}
                                    </span>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1">
                            {products.links.map((l, idx) => {
                                const label = stripHtml(l.label);

                                if (!l.url) {
                                    return (
                                        <span
                                            key={`${label}-${idx}`}
                                            className="cursor-not-allowed rounded-md border px-3 py-1.5 text-xs text-muted-foreground opacity-60"
                                        >
                                            {label}
                                        </span>
                                    );
                                }

                                return (
                                    <Link
                                        key={`${label}-${idx}`}
                                        href={l.url}
                                        preserveScroll
                                        className={[
                                            'rounded-md border px-3 py-1.5 text-xs',
                                            l.active
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
