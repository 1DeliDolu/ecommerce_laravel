import { useForm, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

import {
    store,
    update,
    destroy,
    setDefault,
} from '@/actions/App/Http/Controllers/Account/AddressController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type Address = {
    id: number;
    label: string | null;
    first_name: string;
    last_name: string;
    phone: string | null;
    address1: string;
    address2: string | null;
    city: string;
    postal_code: string;
    country: string;
    is_default: boolean;
};

type FormData = {
    label: string;
    first_name: string;
    last_name: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    postal_code: string;
    country: string;
};

type Props = {
    addresses: Address[];
};

// ─── Constants ──────────────────────────────────────────────────────────────

const emptyForm: FormData = {
    label: '',
    first_name: '',
    last_name: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    postal_code: '',
    country: '',
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Addresses', href: '/account/addresses' },
];

// ─── Address Form ────────────────────────────────────────────────────────────

function AddressForm({
    data,
    errors,
    processing,
    setData,
    onSubmit,
    onCancel,
    submitLabel,
}: {
    data: FormData;
    errors: Partial<Record<keyof FormData, string>>;
    processing: boolean;
    setData: (key: keyof FormData, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
}) {
    return (
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* Label */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="label">Label (optional)</Label>
                <Input
                    id="label"
                    value={data.label}
                    onChange={(e) => setData('label', e.target.value)}
                    placeholder="Home, Work…"
                />
                <InputError message={errors.label} />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                    placeholder="+49 30 123456"
                />
                <InputError message={errors.phone} />
            </div>

            {/* First name */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="first_name">First name</Label>
                <Input
                    id="first_name"
                    value={data.first_name}
                    onChange={(e) => setData('first_name', e.target.value)}
                    placeholder="Jane"
                />
                <InputError message={errors.first_name} />
            </div>

            {/* Last name */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="last_name">Last name</Label>
                <Input
                    id="last_name"
                    value={data.last_name}
                    onChange={(e) => setData('last_name', e.target.value)}
                    placeholder="Doe"
                />
                <InputError message={errors.last_name} />
            </div>

            {/* Address 1 */}
            <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="address1">Address</Label>
                <Input
                    id="address1"
                    value={data.address1}
                    onChange={(e) => setData('address1', e.target.value)}
                    placeholder="123 Main St"
                />
                <InputError message={errors.address1} />
            </div>

            {/* Address 2 */}
            <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="address2">Apartment, suite… (optional)</Label>
                <Input
                    id="address2"
                    value={data.address2}
                    onChange={(e) => setData('address2', e.target.value)}
                    placeholder="Apt 4B"
                />
                <InputError message={errors.address2} />
            </div>

            {/* City */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                    id="city"
                    value={data.city}
                    onChange={(e) => setData('city', e.target.value)}
                    placeholder="Berlin"
                />
                <InputError message={errors.city} />
            </div>

            {/* Postal code */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="postal_code">Postal code</Label>
                <Input
                    id="postal_code"
                    value={data.postal_code}
                    onChange={(e) => setData('postal_code', e.target.value)}
                    placeholder="10115"
                />
                <InputError message={errors.postal_code} />
            </div>

            {/* Country */}
            <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="country">Country</Label>
                <Input
                    id="country"
                    value={data.country}
                    onChange={(e) => setData('country', e.target.value)}
                    placeholder="Germany"
                />
                <InputError message={errors.country} />
            </div>

            {/* Actions */}
            <div className="col-span-full flex gap-2">
                <Button type="submit" disabled={processing}>
                    {processing ? 'Saving…' : submitLabel}
                </Button>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AddressesIndex({ addresses }: Props) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    // ── Add form ──────────────────────────────────────────────────────────────
    const addForm = useForm<FormData>(emptyForm);

    const submitAdd = (e: React.FormEvent) => {
        e.preventDefault();
        addForm.post(store().url, {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
                setShowAddForm(false);
            },
        });
    };

    // ── Edit form ─────────────────────────────────────────────────────────────
    const editForm = useForm<FormData>(emptyForm);

    const startEdit = (a: Address) => {
        editForm.setData({
            label: a.label ?? '',
            first_name: a.first_name,
            last_name: a.last_name,
            phone: a.phone ?? '',
            address1: a.address1,
            address2: a.address2 ?? '',
            city: a.city,
            postal_code: a.postal_code,
            country: a.country,
        });
        setEditingId(a.id);
        setShowAddForm(false);
    };

    const submitEdit = (e: React.FormEvent, id: number) => {
        e.preventDefault();
        editForm.patch(update(id).url, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Addresses" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">
                        Shipping Addresses
                    </h1>
                    {!showAddForm && (
                        <Button
                            size="sm"
                            onClick={() => {
                                setShowAddForm(true);
                                setEditingId(null);
                            }}
                        >
                            Add address
                        </Button>
                    )}
                </div>

                <p className="text-sm text-muted-foreground">
                    Saved addresses are automatically filled in at checkout.
                </p>

                {/* Add form */}
                {showAddForm && (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="mb-4 font-medium">New address</p>
                            <AddressForm
                                data={addForm.data}
                                errors={addForm.errors}
                                processing={addForm.processing}
                                setData={(k, v) => addForm.setData(k, v)}
                                onSubmit={submitAdd}
                                onCancel={() => {
                                    setShowAddForm(false);
                                    addForm.reset();
                                }}
                                submitLabel="Save address"
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Empty state */}
                {addresses.length === 0 && !showAddForm && (
                    <div className="flex h-[40vh] items-center justify-center rounded-xl border border-dashed">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No addresses saved yet.
                        </p>
                    </div>
                )}

                {/* Address cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {addresses.map((addr) => (
                        <Card key={addr.id}>
                            <CardContent className="pt-6">
                                {editingId === addr.id ? (
                                    <AddressForm
                                        data={editForm.data}
                                        errors={editForm.errors}
                                        processing={editForm.processing}
                                        setData={(k, v) =>
                                            editForm.setData(k, v)
                                        }
                                        onSubmit={(e) => submitEdit(e, addr.id)}
                                        onCancel={() => setEditingId(null)}
                                        submitLabel="Update"
                                    />
                                ) : (
                                    <>
                                        {/* Label + default badge */}
                                        <div className="mb-2 flex items-center gap-2">
                                            {addr.label && (
                                                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
                                                    {addr.label}
                                                </span>
                                            )}
                                            {addr.is_default && (
                                                <Badge variant="secondary">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Name */}
                                        <p className="font-medium">
                                            {addr.first_name} {addr.last_name}
                                        </p>
                                        {addr.phone && (
                                            <p className="text-sm text-muted-foreground">
                                                {addr.phone}
                                            </p>
                                        )}
                                        <p className="text-sm">
                                            {addr.address1}
                                        </p>
                                        {addr.address2 && (
                                            <p className="text-sm">
                                                {addr.address2}
                                            </p>
                                        )}
                                        <p className="text-sm">
                                            {addr.city}, {addr.postal_code}
                                        </p>
                                        <p className="text-sm">
                                            {addr.country}
                                        </p>

                                        {/* Actions */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEdit(addr)}
                                            >
                                                Edit
                                            </Button>

                                            {!addr.is_default && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.patch(
                                                            setDefault(addr.id)
                                                                .url,
                                                            {},
                                                            {
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                >
                                                    Set as default
                                                </Button>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() =>
                                                    router.delete(
                                                        destroy(addr.id).url,
                                                        {
                                                            preserveScroll: true,
                                                        },
                                                    )
                                                }
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
