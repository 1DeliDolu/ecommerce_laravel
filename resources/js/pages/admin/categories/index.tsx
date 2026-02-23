import { Head, Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type ParentCategory = {
    id: number;
    name: string;
    slug: string;
};

type CategoryRow = {
    id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    description: string | null;
    is_active: boolean;
    sort_order: number;
    children_count: number;
    parent?: ParentCategory | null;
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginated<T> = {
    data: T[];
    links: PaginationLink[];
};

type Props = {
    filters: {
        search: string;
        status: 'all' | 'active' | 'inactive';
        parent: string | null;
    };
    parents: ParentCategory[];
    categories: Paginated<CategoryRow>;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin Categories', href: '/admin/categories' },
];

function stripLabel(label: string) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/<[^>]*>/g, '')
        .trim();
}

export default function AdminCategoriesIndex({
    filters,
    parents,
    categories,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState<Props['filters']['status']>(
        filters.status ?? 'all',
    );
    const [parent, setParent] = useState<string>(filters.parent ?? 'all');

    const query = useMemo(() => {
        const params: Record<string, string> = {};

        const s = search.trim();
        if (s !== '') params.search = s;

        if (status !== 'all') params.status = status;

        if (parent !== 'all') params.parent = parent;

        return params;
    }, [search, status, parent]);

    const applyFilters = (params: Record<string, string>) => {
        router.get('/admin/categories', params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounced search
    useEffect(() => {
        const t = setTimeout(() => {
            applyFilters(query);
        }, 300);

        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query.search]); // only debounce search; other filters apply immediately

    // Apply immediately for status/parent changes (without waiting debounce)
    useEffect(() => {
        applyFilters(query);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status, parent]);

    const clear = () => {
        setSearch('');
        setStatus('all');
        setParent('all');
        applyFilters({});
    };

    const destroy = (row: CategoryRow) => {
        if (!confirm(`Delete category "${row.name}"?`)) return;

        router.delete(`/admin/categories/${row.slug}`, {
            preserveScroll: true,
            onSuccess: () => {
                // no-op; flash handled server-side
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Categories" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Categories</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage category tree, activation, and ordering.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button asChild>
                            <Link href="/admin/categories/create">
                                Create Category
                            </Link>
                        </Button>
                    </div>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Filters</CardTitle>
                    </CardHeader>

                    <CardContent className="flex flex-col gap-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    Search
                                </div>
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Name or slug..."
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    Status
                                </div>
                                <Select
                                    value={status}
                                    onValueChange={(v) =>
                                        setStatus(
                                            v as Props['filters']['status'],
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="active">
                                            Active
                                        </SelectItem>
                                        <SelectItem value="inactive">
                                            Inactive
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium">
                                    Parent
                                </div>
                                <Select
                                    value={parent}
                                    onValueChange={(v) => setParent(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        {parents.map((p) => (
                                            <SelectItem
                                                key={p.id}
                                                value={String(p.id)}
                                            >
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={clear}>
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Results</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
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
                                            Parent
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Status
                                        </th>
                                        <th className="px-3 py-2 font-medium">
                                            Children
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
                                    {categories.data.length === 0 ? (
                                        <tr>
                                            <td
                                                className="px-3 py-6 text-center text-muted-foreground"
                                                colSpan={7}
                                            >
                                                No categories found.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.data.map((row) => (
                                            <tr
                                                key={row.id}
                                                className="border-t hover:bg-muted/30"
                                            >
                                                <td className="px-3 py-2 font-medium">
                                                    {row.name}
                                                </td>
                                                <td className="px-3 py-2 text-muted-foreground">
                                                    {row.slug}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {row.parent ? (
                                                        <span className="text-muted-foreground">
                                                            {row.parent.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    {row.is_active ? (
                                                        <Badge>Active</Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-muted-foreground">
                                                        {row.children_count}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <span className="text-muted-foreground">
                                                        {row.sort_order}
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
                                                                href={`/admin/categories/${row.slug}`}
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
                                                                href={`/admin/categories/${row.slug}/edit`}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </Button>

                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={() =>
                                                                destroy(row)
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Separator />

                        <div className="flex flex-wrap items-center justify-end gap-1">
                            {categories.links.map((l, idx) => {
                                const label = stripLabel(l.label);

                                if (!l.url) {
                                    return (
                                        <Button
                                            key={`${label}-${idx}`}
                                            variant="outline"
                                            size="sm"
                                            disabled
                                        >
                                            {label}
                                        </Button>
                                    );
                                }

                                return (
                                    <Button
                                        key={`${label}-${idx}`}
                                        variant={
                                            l.active ? 'default' : 'outline'
                                        }
                                        size="sm"
                                        asChild
                                    >
                                        <Link href={l.url}>{label}</Link>
                                    </Button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
