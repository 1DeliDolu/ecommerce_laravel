import { Head, Link, router } from '@inertiajs/react';
import { Search, ShoppingCart, SlidersHorizontal, Tag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import MarketingLayout from '@/layouts/marketing-layout';
import { index as cartIndex } from '@/routes/cart';
import { index as shopIndex, show as shopShow } from '@/routes/shop';

type ShopProduct = {
    id: number;
    slug: string;
    name: string;
    brand: string | null;
    model_name: string | null;
    color: string | null;
    product_type: string | null;
    description: string | null;
    price: number;
    compare_at_price: number | null;
    stock: number;
    image_url: string | null;
    has_size_options: boolean;
    primary_category?: {
        name: string;
        slug: string;
    } | null;
};

type CategoryOption = {
    id: number;
    name: string;
    slug: string;
};

type ShopFilters = {
    category: string;
    search: string;
    brand: string;
    model: string;
    color: string;
    product_type: string;
    clothing_size: string;
    shoe_size: string;
    min_price: number | null;
    max_price: number | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    current_page: number;
    data: T[];
    from: number | null;
    last_page: number;
    links: PaginationLink[];
    to: number | null;
    total: number;
};

type Props = {
    products: Paginator<ShopProduct>;
    categories: CategoryOption[];
    filter_options: {
        brands: string[];
        models: string[];
        colors: string[];
        product_types: string[];
        clothing_sizes: string[];
        shoe_sizes: string[];
    };
    filters: ShopFilters;
};

type FilterForm = {
    category: string;
    search: string;
    brand: string;
    model: string;
    color: string;
    product_type: string;
    clothing_size: string;
    shoe_size: string;
    min_price: string;
    max_price: string;
};

function cleanPaginationLabel(label: string): string {
    return label
        .replace(/&laquo;/g, '«')
        .replace(/&raquo;/g, '»')
        .replace(/&amp;/g, '&')
        .replace(/<[^>]+>/g, '')
        .trim();
}

export default function ShopIndex({ products, categories, filter_options, filters }: Props) {
    const { addItem, itemCount } = useCart();
    const [justAddedProductId, setJustAddedProductId] = useState<number | null>(null);
    const [filterForm, setFilterForm] = useState<FilterForm>({
        category: filters.category ?? '',
        search: filters.search ?? '',
        brand: filters.brand ?? '',
        model: filters.model ?? '',
        color: filters.color ?? '',
        product_type: filters.product_type ?? '',
        clothing_size: filters.clothing_size ?? '',
        shoe_size: filters.shoe_size ?? '',
        min_price: filters.min_price !== null ? String(filters.min_price) : '',
        max_price: filters.max_price !== null ? String(filters.max_price) : '',
    });

    const formatMoney = (price: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    const handleAddToCart = (product: ShopProduct): void => {
        addItem({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            stock: product.stock,
            variant_key: 'default',
            selected_options: {
                brand: product.brand ?? undefined,
                model: product.model_name ?? undefined,
                color: product.color ?? undefined,
                product_type: product.product_type ?? undefined,
            },
        });

        setJustAddedProductId(product.id);

        window.setTimeout(() => {
            setJustAddedProductId((current) =>
                current === product.id ? null : current,
            );
        }, 1000);
    };

    const applyFilters = (): void => {
        const query: Record<string, string> = {};

        if (filterForm.category.trim() !== '') {
            query.category = filterForm.category.trim();
        }

        if (filterForm.search.trim() !== '') {
            query.search = filterForm.search.trim();
        }

        if (filterForm.brand.trim() !== '') {
            query.brand = filterForm.brand.trim();
        }

        if (filterForm.model.trim() !== '') {
            query.model = filterForm.model.trim();
        }

        if (filterForm.color.trim() !== '') {
            query.color = filterForm.color.trim();
        }

        if (filterForm.product_type.trim() !== '') {
            query.product_type = filterForm.product_type.trim();
        }

        if (filterForm.clothing_size.trim() !== '') {
            query.clothing_size = filterForm.clothing_size.trim();
        }

        if (filterForm.shoe_size.trim() !== '') {
            query.shoe_size = filterForm.shoe_size.trim();
        }

        if (filterForm.min_price.trim() !== '') {
            query.min_price = filterForm.min_price.trim();
        }

        if (filterForm.max_price.trim() !== '') {
            query.max_price = filterForm.max_price.trim();
        }

        router.get(shopIndex().url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const resetFilters = (): void => {
        setFilterForm({
            category: '',
            search: '',
            brand: '',
            model: '',
            color: '',
            product_type: '',
            clothing_size: '',
            shoe_size: '',
            min_price: '',
            max_price: '',
        });

        router.get(shopIndex().url, {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const hasActiveFilters =
        filterForm.category !== '' ||
        filterForm.search !== '' ||
        filterForm.brand !== '' ||
        filterForm.model !== '' ||
        filterForm.color !== '' ||
        filterForm.product_type !== '' ||
        filterForm.clothing_size !== '' ||
        filterForm.shoe_size !== '' ||
        filterForm.min_price !== '' ||
        filterForm.max_price !== '';

    return (
        <MarketingLayout title="Shop">
            <Head title="Shop" />

            <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
                <section className="overflow-hidden rounded-3xl border bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50 p-6 shadow-sm">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                                Shop
                            </h1>
                            <p className="mt-2 text-sm text-slate-700">
                                Search, brand, model, size and price filters with 9 products per page.
                            </p>
                        </div>

                        <Button asChild variant="outline" className="bg-white/70">
                            <Link href={cartIndex()}>
                                <ShoppingCart className="mr-2 size-4" />
                                Cart ({itemCount})
                            </Link>
                        </Button>
                    </div>

                    <div className="mt-5 grid gap-3 rounded-2xl border bg-white/80 p-4 md:grid-cols-2 xl:grid-cols-5">
                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Search product name
                            </label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={filterForm.search}
                                    onChange={(event) =>
                                        setFilterForm((current) => ({
                                            ...current,
                                            search: event.target.value,
                                        }))
                                    }
                                    className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
                                    placeholder="e.g. Runner"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Category
                            </label>
                            <select
                                value={filterForm.category}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        category: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All categories</option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.slug}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Brand
                            </label>
                            <select
                                value={filterForm.brand}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        brand: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All brands</option>
                                {filter_options.brands.map((brand) => (
                                    <option key={brand} value={brand}>
                                        {brand}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Model
                            </label>
                            <select
                                value={filterForm.model}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        model: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All models</option>
                                {filter_options.models.map((model) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Color
                            </label>
                            <select
                                value={filterForm.color}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        color: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All colors</option>
                                {filter_options.colors.map((color) => (
                                    <option key={color} value={color}>
                                        {color}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Product type
                            </label>
                            <select
                                value={filterForm.product_type}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        product_type: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All types</option>
                                {filter_options.product_types.map((productType) => (
                                    <option key={productType} value={productType}>
                                        {productType}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Clothing size
                            </label>
                            <select
                                value={filterForm.clothing_size}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        clothing_size: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All sizes</option>
                                {filter_options.clothing_sizes.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Shoe size
                            </label>
                            <select
                                value={filterForm.shoe_size}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        shoe_size: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                            >
                                <option value="">All numbers</option>
                                {filter_options.shoe_sizes.map((size) => (
                                    <option key={size} value={size}>
                                        {size}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Min price
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={filterForm.min_price}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        min_price: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                placeholder="0"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">
                                Max price
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={filterForm.max_price}
                                onChange={(event) =>
                                    setFilterForm((current) => ({
                                        ...current,
                                        max_price: event.target.value,
                                    }))
                                }
                                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                placeholder="999"
                            />
                        </div>

                        <div className="col-span-full flex flex-wrap items-center justify-end gap-2">
                            <Button
                                type="button"
                                onClick={applyFilters}
                                className="self-end"
                            >
                                <SlidersHorizontal className="mr-2 size-4" />
                                Apply
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className="self-end"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </section>

                <div className="mt-5 flex items-center justify-between text-sm text-muted-foreground">
                    <p>
                        {products.from ?? 0}-{products.to ?? 0} / {products.total}
                    </p>
                    {hasActiveFilters ? (
                        <p className="inline-flex items-center gap-1">
                            <Tag className="size-4" />
                            Filtered result
                        </p>
                    ) : null}
                </div>

                {products.data.length === 0 ? (
                    <div className="mt-6 rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
                        No products found for selected filters.
                    </div>
                ) : (
                    <>
                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {products.data.map((product) => (
                                <article
                                    key={product.id}
                                    className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                                >
                                    <Link href={shopShow(product.slug)} className="block">
                                        <div className="h-48 overflow-hidden bg-muted">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                                    No image
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    <div className="space-y-3 p-4">
                                        <div className="flex flex-wrap items-center gap-1">
                                            {product.primary_category ? (
                                                <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs">
                                                    {product.primary_category.name}
                                                </span>
                                            ) : null}
                                            {product.brand ? (
                                                <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs">
                                                    {product.brand}
                                                </span>
                                            ) : null}
                                            {product.product_type ? (
                                                <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs capitalize">
                                                    {product.product_type}
                                                </span>
                                            ) : null}
                                            {product.color ? (
                                                <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs">
                                                    {product.color}
                                                </span>
                                            ) : null}
                                        </div>

                                        <Link href={shopShow(product.slug)} className="block">
                                            <h2 className="line-clamp-1 text-base font-semibold group-hover:underline">
                                                {product.name}
                                            </h2>
                                        </Link>
                                        {product.model_name ? (
                                            <p className="text-xs font-medium text-muted-foreground">
                                                Model: {product.model_name}
                                            </p>
                                        ) : null}

                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                            {product.description ?? 'No description.'}
                                        </p>

                                        <div className="flex items-end justify-between">
                                            <div>
                                                <p className="text-lg font-semibold">
                                                    {formatMoney(product.price)}
                                                </p>
                                                {product.compare_at_price !== null &&
                                                product.compare_at_price > product.price ? (
                                                    <p className="text-xs text-muted-foreground line-through">
                                                        {formatMoney(product.compare_at_price)}
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={shopShow(product.slug)}>
                                                        View
                                                    </Link>
                                                </Button>
                                                {product.has_size_options ? (
                                                    <Button asChild size="sm">
                                                        <Link href={shopShow(product.slug)}>
                                                            Choose
                                                        </Link>
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="button"
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={product.stock <= 0}
                                                        size="sm"
                                                    >
                                                        {product.stock <= 0
                                                            ? 'Out'
                                                            : justAddedProductId === product.id
                                                              ? 'Added'
                                                              : 'Add'}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                            {products.links.map((link, index) => {
                                const label = cleanPaginationLabel(link.label);

                                if (link.url === null) {
                                    return (
                                        <span
                                            key={`${label}-${index}`}
                                            className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground opacity-60"
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
                                        className={`rounded-md border px-3 py-1.5 text-sm transition ${
                                            link.active
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : 'hover:bg-muted'
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </MarketingLayout>
    );
}
