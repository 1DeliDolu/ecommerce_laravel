import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import CategoryForm, {
    type CategoryFormData,
    type ParentCategory,
} from '@/pages/admin/categories/_components/category-form';
import type { BreadcrumbItem } from '@/types';


type Category = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
};

type Props = {
    category: Category;
    parents: ParentCategory[];
};

export default function AdminCategoryEdit({ category, parents }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Categories', href: '/admin/categories' },
        { title: category.name, href: `/admin/categories/${category.slug}` },
        { title: 'Edit', href: `/admin/categories/${category.slug}/edit` },
    ];

    const { data, setData, put, processing, errors } =
        useForm<CategoryFormData>({
            parent_id: category.parent_id ? String(category.parent_id) : null,
            name: category.name,
            slug: category.slug,
            description: category.description ?? '',
            is_active: category.is_active,
            sort_order: category.sort_order ?? 0,
        });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        put(`/admin/categories/${category.slug}`, {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Category: ${category.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Edit Category</h1>
                    <p className="text-sm text-muted-foreground">
                        Update name, slug, parent, and visibility.
                    </p>
                </div>

                <CategoryForm
                    mode="edit"
                    title="Basics"
                    backHref="/admin/categories"
                    submitLabel="Update"
                    parents={parents}
                    data={data}
                    setData={setData}
                    processing={processing}
                    errors={errors}
                    onSubmit={submit}
                    excludeParentId={category.id}
                />
            </div>
        </AppLayout>
    );
}
