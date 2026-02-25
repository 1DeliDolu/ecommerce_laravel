import { Head, Link } from '@inertiajs/react';
import React from 'react';

import AppLayout from '@/layouts/app-layout';
import ProductForm from '@/pages/admin/products/_components/product-form';

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
    image_url?: string | null;
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
    categories: { id: number }[];
    images: ProductImage[];
};

type Props = {
    product: Product;
    categories: Category[];
    selectedCategoryIds: number[];
    catalog_options: {
        brands: string[];
        models: string[];
        colors: string[];
        product_types: string[];
        clothing_sizes: string[];
        shoe_sizes: string[];
    };
};

export default function Edit({
    product,
    categories,
    selectedCategoryIds,
    catalog_options,
}: Props) {
    const initialValues = {
        name: product.name,
        brand: product.brand ?? '',
        model_name: product.model_name ?? '',
        product_type: product.product_type ?? '',
        color: product.color ?? '',
        material: product.material ?? '',
        available_clothing_sizes: product.available_clothing_sizes ?? [],
        available_shoe_sizes: product.available_shoe_sizes ?? [],
        slug: '', // IMPORTANT: do not overwrite slug unless admin explicitly types one
        description: product.description ?? '',
        price: product.price,
        compare_at_price: product.compare_at_price ?? '',
        sku: product.sku ?? '',
        stock: String(product.stock),
        is_active: product.is_active,
        category_ids: selectedCategoryIds,
        images: product.images
            .slice()
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((img) => ({
                disk: img.disk,
                path: img.path,
                image_url: img.image_url ?? null,
                alt: img.alt ?? '',
                sort_order: img.sort_order,
                is_primary: img.is_primary,
            })),
    };

    return (
        <AppLayout>
            <Head title={`Edit ${product.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Edit Product
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Update product details, categories, stock, and
                            images.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/admin/products/${product.slug}`}
                            className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                            View
                        </Link>
                        <Link
                            href="/admin/products"
                            className="inline-flex items-center rounded-md border bg-background px-3 py-2 text-sm font-medium hover:bg-accent"
                        >
                            Back
                        </Link>
                    </div>
                </div>

                <div className="rounded-lg border bg-card p-4">
                    <ProductForm
                        mode="edit"
                        categories={categories}
                        catalogOptions={catalog_options}
                        submitUrl={`/admin/products/${product.slug}`}
                        method="put"
                        initialValues={initialValues}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
