import { Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

type Category = {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
};

type ProductFormData = {
    name: string;
    slug: string;
    description: string;
    price: string;
    compare_at_price: string;
    sku: string;
    stock: string;
    is_active: boolean;
    category_ids: number[];
};

type Mode = 'create' | 'edit';

type Props = {
    mode: Mode;
    categories: Category[];
    submitUrl: string;
    method?: 'post' | 'put' | 'patch';
    initialValues?: Partial<ProductFormData>;
};

function slugify(input: string) {
    return input
        .toLowerCase()
        .trim()
        .replace(/['"]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

export default function ProductForm({
    mode,
    categories,
    submitUrl,
    method = 'post',
    initialValues,
}: Props) {
    const {
        data,
        setData,
        post,
        put,
        patch,
        processing,
        errors,
        recentlySuccessful,
    } = useForm<ProductFormData>({
        name: initialValues?.name ?? '',
        slug: initialValues?.slug ?? '',
        description: initialValues?.description ?? '',
        price: initialValues?.price ?? '',
        compare_at_price: initialValues?.compare_at_price ?? '',
        sku: initialValues?.sku ?? '',
        stock: initialValues?.stock ?? '0',
        is_active: initialValues?.is_active ?? true,
        category_ids: initialValues?.category_ids ?? [],
    });

    const sortedCategories = useMemo(() => {
        return categories.slice().sort((a, b) => a.name.localeCompare(b.name));
    }, [categories]);

    // UX: auto-suggest slug only on create, only if user hasn't typed a custom slug.
    useEffect(() => {
        if (mode !== 'create') return;
        if (data.slug.trim().length > 0) return;
        if (data.name.trim().length === 0) return;

        setData('slug', slugify(data.name));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.name, mode]);

    const toggleCategory = (id: number) => {
        const has = data.category_ids.includes(id);
        setData(
            'category_ids',
            has
                ? data.category_ids.filter((x) => x !== id)
                : [...data.category_ids, id],
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        const action =
            method === 'put' ? put : method === 'patch' ? patch : post;

        action(submitUrl, {
            preserveScroll: true,
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6">
            {/* Top actions */}
            <div className="flex items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground">
                    Fields marked with * are required.
                </div>
                {recentlySuccessful ? (
                    <span className="text-xs text-emerald-700">Saved.</span>
                ) : null}
            </div>

            {/* Basics */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Name *
                    </label>
                    <input
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. Premium Hoodie"
                    />
                    {errors.name ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.name}
                        </div>
                    ) : null}
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Slug {mode === 'create' ? '(auto-suggested)' : ''}
                    </label>
                    <input
                        value={data.slug}
                        onChange={(e) => setData('slug', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. premium-hoodie"
                    />
                    {errors.slug ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.slug}
                        </div>
                    ) : (
                        <div className="mt-1 text-xs text-muted-foreground">
                            Leave empty to auto-generate from name. Slug must be
                            unique.
                        </div>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Price (EUR) *
                    </label>
                    <input
                        value={data.price}
                        onChange={(e) => setData('price', e.target.value)}
                        inputMode="decimal"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. 59.90"
                    />
                    {errors.price ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.price}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Compare at price (optional)
                    </label>
                    <input
                        value={data.compare_at_price}
                        onChange={(e) =>
                            setData('compare_at_price', e.target.value)
                        }
                        inputMode="decimal"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. 79.90"
                    />
                    {errors.compare_at_price ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.compare_at_price}
                        </div>
                    ) : (
                        <div className="mt-1 text-xs text-muted-foreground">
                            Must be greater than or equal to price.
                        </div>
                    )}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        SKU (optional)
                    </label>
                    <input
                        value={data.sku}
                        onChange={(e) => setData('sku', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. SKU-12345AB"
                    />
                    {errors.sku ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.sku}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Stock *
                    </label>
                    <input
                        value={data.stock}
                        onChange={(e) => setData('stock', e.target.value)}
                        inputMode="numeric"
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="0"
                    />
                    {errors.stock ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.stock}
                        </div>
                    ) : null}
                </div>

                <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Description
                    </label>
                    <textarea
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        rows={5}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Describe the product..."
                    />
                    {errors.description ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.description}
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Categories */}
            <div className="rounded-md border bg-background p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium">Categories *</h3>
                        <p className="text-xs text-muted-foreground">
                            Select at least one category.
                        </p>
                    </div>
                    {errors.category_ids ? (
                        <div className="text-xs text-destructive">
                            {errors.category_ids}
                        </div>
                    ) : null}
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedCategories.map((c) => {
                        const checked = data.category_ids.includes(c.id);
                        return (
                            <label
                                key={c.id}
                                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleCategory(c.id)}
                                    className="h-4 w-4"
                                />
                                <span className="truncate">{c.name}</span>
                            </label>
                        );
                    })}
                </div>
            </div>

            {/* Active */}
            <div className="rounded-md border bg-background p-4">
                <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(e) => setData('is_active', e.target.checked)}
                        className="h-4 w-4"
                    />
                    <span className="font-medium">Active</span>
                </label>
                {errors.is_active ? (
                    <div className="mt-1 text-xs text-destructive">
                        {errors.is_active}
                    </div>
                ) : null}
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2">
                <Link
                    href="/admin/products"
                    className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                    Cancel
                </Link>

                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:opacity-90 disabled:opacity-60"
                >
                    {processing
                        ? 'Saving...'
                        : mode === 'create'
                          ? 'Create'
                          : 'Save'}
                </button>
            </div>
        </form>
    );
}
