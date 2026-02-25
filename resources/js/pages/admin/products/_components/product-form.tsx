import { Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo } from 'react';

type Category = {
    id: number;
    name: string;
    slug: string;
    parent_id: number | null;
};

type ImageInput = {
    disk?: string;
    path: string;
    image_url?: string | null;
    alt?: string | null;
    sort_order?: number;
    is_primary?: boolean;
};

type ProductFormData = {
    name: string;
    brand: string;
    model_name: string;
    product_type: string;
    color: string;
    material: string;
    available_clothing_sizes: string[];
    available_shoe_sizes: string[];
    slug: string;
    description: string;
    price: string;
    compare_at_price: string;
    sku: string;
    stock: string;
    is_active: boolean;
    category_ids: number[];
    images: ImageInput[];
    uploaded_images: File[];
};

type Mode = 'create' | 'edit';

type CatalogOptions = {
    brands: string[];
    models: string[];
    colors: string[];
    product_types: string[];
    clothing_sizes: string[];
    shoe_sizes: string[];
};

type Props = {
    mode: Mode;
    categories: Category[];
    catalogOptions: CatalogOptions;
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

function resolveImageUrl(image: ImageInput): string | null {
    if (typeof image.image_url === 'string' && image.image_url.trim() !== '') {
        return image.image_url;
    }

    if (image.path.trim() === '') {
        return null;
    }

    if (image.path.startsWith('http://') || image.path.startsWith('https://')) {
        return image.path;
    }

    if (image.path.startsWith('/')) {
        return image.path;
    }

    if ((image.disk ?? 'public') === 'public') {
        return `/storage/${image.path.replace(/^\/+/, '')}`;
    }

    return null;
}

function formatOptionLabel(value: string): string {
    if (value.length === 0) {
        return value;
    }

    return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function ProductForm({
    mode,
    categories,
    catalogOptions,
    submitUrl,
    method = 'post',
    initialValues,
}: Props) {
    const {
        data,
        setData,
        post,
        transform,
        processing,
        errors,
        recentlySuccessful,
        progress,
    } = useForm<ProductFormData>({
        name: initialValues?.name ?? '',
        brand: initialValues?.brand ?? '',
        model_name: initialValues?.model_name ?? '',
        product_type: initialValues?.product_type ?? '',
        color: initialValues?.color ?? '',
        material: initialValues?.material ?? '',
        available_clothing_sizes: initialValues?.available_clothing_sizes ?? [],
        available_shoe_sizes: initialValues?.available_shoe_sizes ?? [],
        slug: initialValues?.slug ?? '',
        description: initialValues?.description ?? '',
        price: initialValues?.price ?? '',
        compare_at_price: initialValues?.compare_at_price ?? '',
        sku: initialValues?.sku ?? '',
        stock: initialValues?.stock ?? '0',
        is_active: initialValues?.is_active ?? true,
        category_ids: initialValues?.category_ids ?? [],
        images: initialValues?.images ?? [],
        uploaded_images: [],
    });

    const sortedCategories = useMemo(() => {
        return categories.slice().sort((a, b) => a.name.localeCompare(b.name));
    }, [categories]);

    const uploadedImagePreviews = useMemo(() => {
        return data.uploaded_images.map((file) => ({
            key: `${file.name}-${file.size}-${file.lastModified}`,
            name: file.name,
            sizeKb: Math.ceil(file.size / 1024),
            url: URL.createObjectURL(file),
        }));
    }, [data.uploaded_images]);

    useEffect(() => {
        return () => {
            uploadedImagePreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
        };
    }, [uploadedImagePreviews]);

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

    const toggleMultiSelectValue = (
        key: 'available_clothing_sizes' | 'available_shoe_sizes',
        value: string,
    ) => {
        const has = data[key].includes(value);
        const nextValues = has
            ? data[key].filter((current) => current !== value)
            : [...data[key], value];

        setData(key, nextValues);
    };

    const addImage = () => {
        setData('images', [
            ...data.images,
            {
                disk: 'public',
                path: '',
                alt: '',
                sort_order: data.images.length,
                is_primary: data.images.length === 0,
            },
        ]);
    };

    const removeImage = (index: number) => {
        const next = data.images.filter((_, i) => i !== index);
        if (next.length > 0 && !next.some((x) => x.is_primary)) {
            next[0].is_primary = true;
        }
        next.forEach((img, i) => (img.sort_order = i));
        setData('images', next);
    };

    const setPrimary = (index: number) => {
        const next = data.images.map((img, i) => ({
            ...img,
            is_primary: i === index,
        }));
        setData('images', next);
    };

    const handleUploadedImages = (files: FileList | null) => {
        if (files === null) {
            setData('uploaded_images', []);

            return;
        }

        setData('uploaded_images', Array.from(files));
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (method !== 'post') {
            transform((payload) => ({
                ...payload,
                _method: method.toUpperCase(),
            }));
        }

        post(submitUrl, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setData('uploaded_images', []);
            },
        });
    };

    return (
        <form onSubmit={submit} className="space-y-6" encType="multipart/form-data">
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
                        Brand
                    </label>
                    <select
                        value={data.brand}
                        onChange={(e) => setData('brand', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Select brand</option>
                        {catalogOptions.brands.map((brand) => (
                            <option key={brand} value={brand}>
                                {brand}
                            </option>
                        ))}
                    </select>
                    {errors.brand ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.brand}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Model
                    </label>
                    <select
                        value={data.model_name}
                        onChange={(e) => setData('model_name', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Select model</option>
                        {catalogOptions.models.map((model) => (
                            <option key={model} value={model}>
                                {model}
                            </option>
                        ))}
                    </select>
                    {errors.model_name ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.model_name}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Product type
                    </label>
                    <select
                        value={data.product_type}
                        onChange={(e) => setData('product_type', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Select type</option>
                        {catalogOptions.product_types.map((type) => (
                            <option key={type} value={type}>
                                {formatOptionLabel(type)}
                            </option>
                        ))}
                    </select>
                    {errors.product_type ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.product_type}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Color
                    </label>
                    <select
                        value={data.color}
                        onChange={(e) => setData('color', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">Select color</option>
                        {catalogOptions.colors.map((color) => (
                            <option key={color} value={color}>
                                {color}
                            </option>
                        ))}
                    </select>
                    {errors.color ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.color}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Material
                    </label>
                    <input
                        value={data.material}
                        onChange={(e) => setData('material', e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                        placeholder="e.g. Cotton Blend"
                    />
                    {errors.material ? (
                        <div className="mt-1 text-xs text-destructive">
                            {errors.material}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Clothing sizes
                    </label>
                    <div className="grid grid-cols-4 gap-2 rounded-md border bg-background p-2">
                        {catalogOptions.clothing_sizes.map((size) => (
                            <label
                                key={size}
                                className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent"
                            >
                                <input
                                    type="checkbox"
                                    checked={data.available_clothing_sizes.includes(size)}
                                    onChange={() =>
                                        toggleMultiSelectValue('available_clothing_sizes', size)
                                    }
                                    className="h-4 w-4"
                                />
                                <span>{size}</span>
                            </label>
                        ))}
                    </div>
                    {(errors as Record<string, string>).available_clothing_sizes ? (
                        <div className="mt-1 text-xs text-destructive">
                            {(errors as Record<string, string>).available_clothing_sizes}
                        </div>
                    ) : null}
                </div>

                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Shoe sizes
                    </label>
                    <div className="grid grid-cols-4 gap-2 rounded-md border bg-background p-2">
                        {catalogOptions.shoe_sizes.map((size) => (
                            <label
                                key={size}
                                className="flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent"
                            >
                                <input
                                    type="checkbox"
                                    checked={data.available_shoe_sizes.includes(size)}
                                    onChange={() =>
                                        toggleMultiSelectValue('available_shoe_sizes', size)
                                    }
                                    className="h-4 w-4"
                                />
                                <span>{size}</span>
                            </label>
                        ))}
                    </div>
                    {(errors as Record<string, string>).available_shoe_sizes ? (
                        <div className="mt-1 text-xs text-destructive">
                            {(errors as Record<string, string>).available_shoe_sizes}
                        </div>
                    ) : null}
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

            {/* Images */}
            <div className="rounded-md border bg-background p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-sm font-medium">Images</h3>
                        <p className="text-xs text-muted-foreground">
                            You can upload images from your computer or manage
                            existing image paths.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={addImage}
                        className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                    >
                        Add image
                    </button>
                </div>

                <div className="mt-4 rounded-md border border-dashed bg-muted/20 p-3">
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Upload from computer
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(event) =>
                            handleUploadedImages(event.target.files)
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                    />
                    {(errors as Record<string, string>).uploaded_images ? (
                        <div className="mt-1 text-xs text-destructive">
                            {(errors as Record<string, string>).uploaded_images}
                        </div>
                    ) : null}
                    {uploadedImagePreviews.length > 0 ? (
                        <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                            <div className="font-medium text-foreground">
                                Selected files:
                            </div>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                {uploadedImagePreviews.map((preview) => (
                                    <div key={preview.key} className="space-y-1">
                                        <div className="aspect-square overflow-hidden rounded-md border bg-muted/30">
                                            <img
                                                src={preview.url}
                                                alt={preview.name}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="truncate" title={preview.name}>
                                            {preview.name}
                                        </div>
                                        <div>{preview.sizeKb} KB</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}
                    {progress ? (
                        <div className="mt-2 text-xs text-muted-foreground">
                            Uploading: {progress.percentage}%
                        </div>
                    ) : null}
                </div>

                {errors.images ? (
                    <div className="mt-2 text-xs text-destructive">
                        {errors.images as string}
                    </div>
                ) : null}

                <div className="mt-4 space-y-3">
                    {data.images.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                            No images.
                        </div>
                    ) : (
                        data.images.map((img, idx) => {
                            const imageUrl = resolveImageUrl(img);

                            return (
                            <div key={idx} className="rounded-md border p-3">
                                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted/30">
                                        {imageUrl ? (
                                            <img
                                                src={imageUrl}
                                                alt={img.alt ?? `Image ${idx + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : null}
                                    </div>
                                    <div className="grid w-full gap-3 md:grid-cols-3">
                                        <div className="md:col-span-2">
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                Path *
                                            </label>
                                            <input
                                                value={img.path}
                                                onChange={(e) => {
                                                    const next = [
                                                        ...data.images,
                                                    ];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        path: e.target.value,
                                                    };
                                                    setData('images', next);
                                                }}
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                                                placeholder="products/abc.jpg"
                                            />
                                            {(errors as Record<string, string>)[
                                                `images.${idx}.path`
                                            ] ? (
                                                <div className="mt-1 text-xs text-destructive">
                                                    {
                                                        (
                                                            errors as Record<
                                                                string,
                                                                string
                                                            >
                                                        )[`images.${idx}.path`]
                                                    }
                                                </div>
                                            ) : null}
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                Alt (optional)
                                            </label>
                                            <input
                                                value={img.alt ?? ''}
                                                onChange={(e) => {
                                                    const next = [
                                                        ...data.images,
                                                    ];
                                                    next[idx] = {
                                                        ...next[idx],
                                                        alt: e.target.value,
                                                    };
                                                    setData('images', next);
                                                }}
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                                                placeholder="e.g. Front view"
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                                Sort order
                                            </label>
                                            <input
                                                value={String(
                                                    img.sort_order ?? idx,
                                                )}
                                                onChange={(e) => {
                                                    const next = [
                                                        ...data.images,
                                                    ];
                                                    const val = Number(
                                                        e.target.value,
                                                    );
                                                    next[idx] = {
                                                        ...next[idx],
                                                        sort_order:
                                                            Number.isFinite(val)
                                                                ? val
                                                                : idx,
                                                    };
                                                    setData('images', next);
                                                }}
                                                inputMode="numeric"
                                                className="w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background outline-none focus:ring-2 focus:ring-ring"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPrimary(idx)}
                                            className={[
                                                'rounded-md border px-3 py-2 text-sm font-medium',
                                                img.is_primary
                                                    ? 'bg-accent'
                                                    : 'bg-background hover:bg-accent',
                                            ].join(' ')}
                                        >
                                            {img.is_primary
                                                ? 'Primary'
                                                : 'Set primary'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )})
                    )}
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
