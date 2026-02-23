import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';
import CategoryForm, {
    type CategoryFormData,
    type ParentCategory,
} from '@/pages/admin/categories/_components/category-form';
import type { BreadcrumbItem } from '@/types';


type Props = {
    parents: ParentCategory[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Categories', href: '/admin/categories' },
    { title: 'Create', href: '/admin/categories/create' },
];

export default function AdminCategoryCreate({ parents }: Props) {
    const { data, setData, post, processing, errors, reset } =
        useForm<CategoryFormData>({
            parent_id: null,
            name: '',
            slug: '',
            description: '',
            is_active: true,
            sort_order: 0,
        });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        post('/admin/categories', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Category" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div>
                    <h1 className="text-xl font-semibold">Create Category</h1>
                    <p className="text-sm text-muted-foreground">
                        Add a new category for products.
                    </p>
                </div>

                <CategoryForm
                    mode="create"
                    title="Basics"
                    backHref="/admin/categories"
                    submitLabel="Create"
                    parents={parents}
                    data={data}
                    setData={setData}
                    processing={processing}
                    errors={errors}
                    onSubmit={submit}
                />
            </div>
        </AppLayout>
    );
}
