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

type Props = {
    categories: Category[];
};

export default function Create({ categories }: Props) {
    return (
        <AppLayout>
            <Head title="Create Product" />

            <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Create Product
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new product and assign it to categories.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
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
                        mode="create"
                        categories={categories}
                        submitUrl="/admin/products"
                    />
                </div>
            </div>
        </AppLayout>
    );
}
