import { Head, Link, router } from '@inertiajs/react';
import React, { useEffect, useMemo, useState } from 'react';

import MarketingLayout from '@/layouts/marketing-layout';

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
    price: string;
    compare_at_price: string | null;
    stock: number;
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
    category: string;
    sort: 'newest' | 'price_asc' | 'price_desc';
};

type Props = {
    products: Paginator<Product>;
    categories: Category[];
    filters: Filters;
};

function stripHtml(input: string): string {
    return input.replace(/<[^>]*>/g, '').trim();
}

function formatMoney(value: string | number) {
    const n = typeof value === 'string' ? Number(value) : value;
    return n.toFixed(2);
}

export default function Index({ products, categories, filters }: Props) {
    const [local, setLocal] = useState<Filters>(filters);

    useEffect(() => {
        setLocal(filters);
    }, [filters.q, filters.category, filters.sort, filters]);

    const categoryOptions = useMemo(
        () => categories.slice().sort((a, b) => a.name.localeCompare(b.name)),
        [categories],
    );

    const applyFilters = (next: Filters) => {
        setLocal(next);

        router.get(
            '/products',
            {
                q: next.q || '',
                category: next.category || '',
                sort: next.sort || 'newest',
            },
            { preserveScroll: true, preserveState: true, replace: true },
        );
    };

    // Debounce only the search query
    useEffect(() => {
        const handle = window.setTimeout(() => {
            router.get(
                '/products',
                {
                    q: local.q || '',
                    category: local.category || '',
                    sort: local.sort || 'newest',
                },
                { preserveScroll: true, preserveState: true, replace: true },
            );
        }, 350);

        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [local.q]);

    return (
        <MarketingLayout>
            <Head title="Shop" />

            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-[#1b1b18] dark:text-[#EDEDEC]">
                            Shop
                        </h1>
                        <p className="text-sm text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                            Browse our products. Only active products are
                            listed.
                        </p>
                    </div>

                    <div className="text-sm text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                        {products.meta?.total != null
                            ? `${products.meta.total} items`
                            : null}
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-6 rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0a]/40">
                    <div className="grid gap-3 md:grid-cols-6">
                        <div className="md:col-span-3">
                            <label className="mb-1 block text-xs font-medium text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
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
                                placeholder="Name, slug, SKU…"
                                className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-[#0a0a0a] dark:focus:ring-white/10"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1 block text-xs font-medium text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
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
                                className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-[#0a0a0a] dark:focus:ring-white/10"
                            >
                                <option value="">All</option>
                                {categoryOptions.map((c) => (
                                    <option key={c.id} value={c.slug}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-1">
                            <label className="mb-1 block text-xs font-medium text-[#1b1b18]/70 dark:text-[#EDEDEC]/70">
                                Sort
                            </label>
                            <select
                                value={local.sort}
                                onChange={(e) =>
                                    applyFilters({
                                        ...local,
                                        sort: e.target.value as Filters['sort'],
                                    })
                                }
                                className="w-full rounded-md border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10 dark:border-white/10 dark:bg-[#0a0a0a] dark:focus:ring-white/10"
                            >
                                <option value="newest">Newest</option>
                                <option value="price_asc">
                                    Price: Low → High
                                </option>
                                <option value="price_desc">
                                    Price: High → Low
                                </option>
                            </select>
                        </div>

                        <div className="md:col-span-6">
                            <button
                                type="button"
                                onClick={() =>
                                    applyFilters({
                                        q: '',
                                        category: '',
                                        sort: 'newest',
                                    })
                                }
                                className="inline-flex items-center rounded-md border border-black/10 bg-white px-3 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:bg-[#0a0a0a] dark:hover:bg-white/5"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {products.data.length === 0 ? (
                        <div className="col-span-full rounded-lg border border-black/5 bg-white/60 p-6 text-sm text-[#1b1b18]/70 dark:border-white/10 dark:bg-[#0a0a0a]/40 dark:text-[#EDEDEC]/70">
                            No products found.
                        </div>
                    ) : (
                        products.data.map((p) => (
                            <Link
                                key={p.id}
                                href={`/products/${p.slug}`}
                                className="group rounded-lg border border-black/5 bg-white/60 p-4 backdrop-blur transition hover:bg-white dark:border-white/10 dark:bg-[#0a0a0a]/40 dark:hover:bg-[#0a0a0a]"
                            >
                                <div className="aspect-[4/3] w-full rounded-md border border-black/10 bg-black/5 dark:border-white/10 dark:bg-white/5" />

                                <div className="mt-3 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="truncate text-sm font-medium text-[#1b1b18] group-hover:underline dark:text-[#EDEDEC]">
                                            {p.name}
                                        </div>
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {p.categories
                                                .slice(0, 2)
                                                .map((c) => (
                                                    <span
                                                        key={c.id}
                                                        className="rounded bg-black/5 px-2 py-0.5 text-[11px] text-[#1b1b18]/80 dark:bg-white/5 dark:text-[#EDEDEC]/80"
                                                    >
                                                        {c.name}
                                                    </span>
                                                ))}
                                            {p.categories.length > 2 ? (
                                                <span className="rounded bg-black/5 px-2 py-0.5 text-[11px] text-[#1b1b18]/80 dark:bg-white/5 dark:text-[#EDEDEC]/80">
                                                    +{p.categories.length - 2}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm font-semibold text-[#1b1b18] dark:text-[#EDEDEC]">
                                            €{formatMoney(p.price)}
                                        </div>
                                        {p.compare_at_price ? (
                                            <div className="text-xs text-[#1b1b18]/60 line-through dark:text-[#EDEDEC]/60">
                                                €
                                                {formatMoney(
                                                    p.compare_at_price,
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="mt-2 text-xs text-[#1b1b18]/60 dark:text-[#EDEDEC]/60">
                                    {p.stock > 0
                                        ? `${p.stock} in stock`
                                        : 'Out of stock'}
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-[#1b1b18]/60 dark:text-[#EDEDEC]/60">
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
                        ) : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                        {products.links.map((l, idx) => {
                            const label = stripHtml(l.label);

                            if (!l.url) {
                                return (
                                    <span
                                        key={`${label}-${idx}`}
                                        className="cursor-not-allowed rounded-md border border-black/10 bg-white px-3 py-1.5 text-xs text-[#1b1b18]/50 opacity-70 dark:border-white/10 dark:bg-[#0a0a0a] dark:text-[#EDEDEC]/50"
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
                                        'border-black/10 bg-white hover:bg-black/5 dark:border-white/10 dark:bg-[#0a0a0a] dark:hover:bg-white/5',
                                        l.active ? 'font-medium' : '',
                                    ].join(' ')}
                                >
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
