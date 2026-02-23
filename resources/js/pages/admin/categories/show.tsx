import { Head, Link } from '@inertiajs/react';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ChildCategory = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    is_active: boolean;
    sort_order: number;
};

type ParentCategory = {
    id: number;
    name: string;
    slug: string;
};

type Category = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    parent?: ParentCategory | null;
    children?: ChildCategory[];
};

type Props = {
    category: Category;
};

export default function AdminCategoryShow({ category }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Admin Categories', href: '/admin/categories' },
        { title: category.name, href: `/admin/categories/${category.slug}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Category: ${category.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">
                            {category.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {category.slug}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/categories">Back</Link>
                        </Button>

                        <Button asChild>
                            <Link
                                href={`/admin/categories/${category.slug}/edit`}
                            >
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-muted-foreground">
                                    Status:
                                </span>
                                {category.is_active ? (
                                    <Badge>Active</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}

                                <span className="ml-2 text-muted-foreground">
                                    Sort order:
                                </span>
                                <span>{category.sort_order}</span>
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <div className="text-muted-foreground">
                                    Parent
                                </div>
                                <div>
                                    {category.parent ? (
                                        <Link
                                            href={`/admin/categories/${category.parent.slug}`}
                                            className="text-primary underline-offset-4 hover:underline"
                                        >
                                            {category.parent.name}
                                        </Link>
                                    ) : (
                                        <span className="text-muted-foreground">
                                            —
                                        </span>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-1">
                                <div className="text-muted-foreground">
                                    Description
                                </div>
                                <div className="whitespace-pre-wrap">
                                    {category.description?.trim()
                                        ? category.description
                                        : '—'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button variant="outline" asChild>
                                <Link
                                    href={`/admin/categories/${category.slug}/edit`}
                                >
                                    Edit Category
                                </Link>
                            </Button>

                            <Button variant="outline" asChild>
                                <Link href="/admin/categories/create">
                                    Create New
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                            Children ({category.children?.length ?? 0})
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        {category.children && category.children.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50">
                                        <tr className="text-left">
                                            <th className="px-3 py-2 font-medium">
                                                Name
                                            </th>
                                            <th className="px-3 py-2 font-medium">
                                                Slug
                                            </th>
                                            <th className="px-3 py-2 font-medium">
                                                Status
                                            </th>
                                            <th className="px-3 py-2 font-medium">
                                                Sort
                                            </th>
                                            <th className="px-3 py-2 text-right font-medium">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {category.children.map((c) => (
                                            <tr
                                                key={c.id}
                                                className="border-t hover:bg-muted/30"
                                            >
                                                <td className="px-3 py-2 font-medium">
                                                    {c.name}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {c.slug}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {c.is_active ? (
                                                        <Badge>Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-muted-foreground">
                                                        {c.sort_order}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/categories/${c.slug}`}
                                                            >
                                                                View
                                                            </Link>
                                                        </Button>

                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/categories/${c.slug}/edit`}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground">
                                No children categories.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
