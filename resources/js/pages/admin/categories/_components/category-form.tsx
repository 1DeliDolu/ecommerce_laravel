import { Link } from '@inertiajs/react';
import { type ChangeEvent, useEffect } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export type ParentCategory = {
    id: number;
    name: string;
    slug: string;
};

export type CategoryFormData = {
    parent_id: string | null;
    name: string;
    slug: string;
    description: string;
    is_active: boolean;
    sort_order: number | null;
};

type Props = {
    mode: 'create' | 'edit';
    title: string;
    backHref: string;
    submitLabel: string;

    parents: ParentCategory[];

    data: CategoryFormData;
    setData: <K extends keyof CategoryFormData>(
        key: K,
        value: CategoryFormData[K],
    ) => void;

    processing: boolean;
    errors: Partial<Record<keyof CategoryFormData | string, string>>;

    onSubmit: (e: React.FormEvent) => void;

    /**
     * For edit pages: category id to exclude from parent options (optional).
     */
    excludeParentId?: number;
};

export default function CategoryForm({
    mode,
    title,
    backHref,
    submitLabel,
    parents,
    data,
    setData,
    processing,
    errors,
    onSubmit,
    excludeParentId,
}: Props) {
    // Auto-suggest slug only on create and only if user didn't type a slug yet.
    useEffect(() => {
        if (mode !== 'create') return;
        if (data.slug.trim() !== '') return;

        const s = data.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        setData('slug', s);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, data.name]);

    const availableParents = excludeParentId
        ? parents.filter((p) => p.id !== excludeParentId)
        : parents;

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <CardTitle className="text-base">{title}</CardTitle>

                        <Button variant="outline" asChild>
                            <Link href={backHref}>Back</Link>
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. Electronics"
                                autoFocus={mode === 'create'}
                            />
                            <InputError message={errors.name} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) =>
                                    setData('slug', e.target.value)
                                }
                                placeholder="e.g. electronics"
                            />
                            <InputError message={errors.slug} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                value={data.description}
                                onChange={(
                                    e: ChangeEvent<HTMLTextAreaElement>,
                                ) => setData('description', e.target.value)}
                                placeholder="Optional short description..."
                                rows={4}
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                            />
                            <InputError message={errors.description} />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Parent</Label>
                                <Select
                                    value={data.parent_id ?? 'none'}
                                    onValueChange={(v) =>
                                        setData(
                                            'parent_id',
                                            v === 'none' ? null : v,
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="No parent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            No parent
                                        </SelectItem>
                                        {availableParents.map((p) => (
                                            <SelectItem
                                                key={p.id}
                                                value={String(p.id)}
                                            >
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.parent_id} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sort_order">Sort order</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    value={data.sort_order ?? 0}
                                    onChange={(e) =>
                                        setData(
                                            'sort_order',
                                            e.target.value === ''
                                                ? null
                                                : Number(e.target.value),
                                        )
                                    }
                                    min={0}
                                />
                                <InputError message={errors.sort_order} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(v) =>
                                        setData('is_active', Boolean(v))
                                    }
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>

                            <InputError message={errors.is_active} />
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-end gap-2">
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : submitLabel}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
