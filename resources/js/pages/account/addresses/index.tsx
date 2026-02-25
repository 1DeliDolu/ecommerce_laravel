import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Edit3, MapPin, Plus, Star, Trash2 } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import {
    destroy as destroyAddress,
    index as addressesIndex,
    setDefault as setDefaultAddress,
    store as storeAddress,
    update as updateAddress,
} from '@/routes/account/addresses';
import type { BreadcrumbItem } from '@/types';

type Address = {
    id: number;
    label: string | null;
    first_name: string;
    last_name: string;
    phone: string | null;
    line1: string;
    line2: string | null;
    city: string;
    state: string | null;
    postal_code: string;
    country: string;
    is_default: boolean;
};

type AddressFormData = {
    label: string;
    first_name: string;
    last_name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
};

const emptyAddressForm: AddressFormData = {
    label: '',
    first_name: '',
    last_name: '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false,
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Addresses', href: addressesIndex().url },
];

export default function AddressesIndex() {
    const { addresses } = usePage<{ addresses: Address[] }>().props;
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [formVisible, setFormVisible] = useState(addresses.length === 0);

    const form = useForm<AddressFormData>(emptyAddressForm);

    const isEditing = editingAddressId !== null;
    const pageTitle = isEditing ? 'Edit Address' : 'Add New Address';
    const primaryActionLabel = isEditing ? 'Update Address' : 'Save Address';

    const sortedAddresses = useMemo(() => {
        return [...addresses].sort((a, b) => {
            if (a.is_default !== b.is_default) {
                return a.is_default ? -1 : 1;
            }

            return b.id - a.id;
        });
    }, [addresses]);

    const beginCreate = (): void => {
        setEditingAddressId(null);
        form.reset();
        form.clearErrors();
        setFormVisible(true);
    };

    const beginEdit = (address: Address): void => {
        setEditingAddressId(address.id);
        form.setData({
            label: address.label ?? '',
            first_name: address.first_name,
            last_name: address.last_name,
            phone: address.phone ?? '',
            line1: address.line1,
            line2: address.line2 ?? '',
            city: address.city,
            state: address.state ?? '',
            postal_code: address.postal_code,
            country: address.country,
            is_default: address.is_default,
        });
        form.clearErrors();
        setFormVisible(true);
    };

    const cancelForm = (): void => {
        setEditingAddressId(null);
        form.reset();
        form.clearErrors();
        setFormVisible(addresses.length === 0);
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setEditingAddressId(null);
                form.reset();
                form.clearErrors();
                setFormVisible(false);
            },
        };

        if (editingAddressId === null) {
            form.post(storeAddress().url, options);

            return;
        }

        form.patch(updateAddress(editingAddressId).url, options);
    };

    const removeAddress = (address: Address): void => {
        if (!window.confirm('Delete this address?')) {
            return;
        }

        router.delete(destroyAddress(address.id).url, {
            preserveScroll: true,
        });
    };

    const makeDefault = (address: Address): void => {
        if (address.is_default) {
            return;
        }

        router.patch(
            setDefaultAddress(address.id).url,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Addresses" />

            <div className="space-y-6 p-4">
                <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-[0.12em] text-black uppercase">
                                Account Address Book
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight text-black">
                                Addresses
                            </h1>
                            <p className="max-w-2xl text-sm text-black">
                                Manage delivery addresses. Your default address
                                is automatically prefilled during checkout.
                            </p>
                        </div>

                        <Button
                            type="button"
                            onClick={beginCreate}
                            className="self-start sm:self-auto"
                        >
                            <Plus className="size-4" />
                            New Address
                        </Button>
                    </div>
                </section>

                {formVisible && (
                    <section className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                {pageTitle}
                            </h2>
                            {addresses.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={cancelForm}
                                >
                                    Cancel
                                </Button>
                            )}
                        </div>

                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="label">Label</Label>
                                    <Input
                                        id="label"
                                        value={form.data.label}
                                        onChange={(event) =>
                                            form.setData(
                                                'label',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Home, Office..."
                                    />
                                    {form.errors.label && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.label}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={form.data.phone}
                                        onChange={(event) =>
                                            form.setData(
                                                'phone',
                                                event.target.value,
                                            )
                                        }
                                        placeholder="+90 555 000 00 00"
                                    />
                                    {form.errors.phone && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.phone}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="first_name">
                                        First Name
                                    </Label>
                                    <Input
                                        id="first_name"
                                        value={form.data.first_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'first_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.first_name && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.first_name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="last_name">Last Name</Label>
                                    <Input
                                        id="last_name"
                                        value={form.data.last_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'last_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.last_name && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.last_name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="line1">
                                        Address Line 1
                                    </Label>
                                    <Input
                                        id="line1"
                                        value={form.data.line1}
                                        onChange={(event) =>
                                            form.setData(
                                                'line1',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.line1 && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.line1}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="line2">
                                        Address Line 2
                                    </Label>
                                    <Input
                                        id="line2"
                                        value={form.data.line2}
                                        onChange={(event) =>
                                            form.setData(
                                                'line2',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.line2 && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.line2}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={form.data.city}
                                        onChange={(event) =>
                                            form.setData(
                                                'city',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.city && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.city}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={form.data.state}
                                        onChange={(event) =>
                                            form.setData(
                                                'state',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.state && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.state}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">
                                        Postal Code
                                    </Label>
                                    <Input
                                        id="postal_code"
                                        value={form.data.postal_code}
                                        onChange={(event) =>
                                            form.setData(
                                                'postal_code',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.postal_code && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.postal_code}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Input
                                        id="country"
                                        value={form.data.country}
                                        onChange={(event) =>
                                            form.setData(
                                                'country',
                                                event.target.value,
                                            )
                                        }
                                    />
                                    {form.errors.country && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.country}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <label className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
                                <Checkbox
                                    checked={form.data.is_default}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_default',
                                            checked === true,
                                        )
                                    }
                                />
                                <span className="text-sm font-medium">
                                    Set as default checkout address
                                </span>
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {primaryActionLabel}
                                </Button>
                                {addresses.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={cancelForm}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </section>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sortedAddresses.length === 0 && !formVisible && (
                        <div className="col-span-full rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
                            <MapPin className="mx-auto mb-3 size-6 text-muted-foreground" />
                            <h3 className="text-base font-semibold">
                                No addresses yet
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add your first address to speed up checkout.
                            </p>
                            <Button
                                type="button"
                                className="mt-4"
                                onClick={beginCreate}
                            >
                                Add Address
                            </Button>
                        </div>
                    )}

                    {sortedAddresses.map((address) => (
                        <article
                            key={address.id}
                            className={cn(
                                'rounded-2xl border bg-card p-5 shadow-sm transition',
                                address.is_default &&
                                    'border-amber-300 bg-amber-50/40',
                            )}
                        >
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                                        {address.label ?? 'Address'}
                                    </p>
                                    <h3 className="text-base font-semibold">
                                        {address.first_name} {address.last_name}
                                    </h3>
                                </div>

                                {address.is_default ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                                        <Star className="size-3.5" />
                                        Default
                                    </span>
                                ) : null}
                            </div>

                            <div className="space-y-1.5 text-sm text-muted-foreground">
                                <p className="text-foreground">
                                    {address.line1}
                                </p>
                                {address.line2 ? <p>{address.line2}</p> : null}
                                <p>
                                    {address.city}
                                    {address.state
                                        ? `, ${address.state}`
                                        : ''}{' '}
                                    {address.postal_code}
                                </p>
                                <p>{address.country}</p>
                                {address.phone ? <p>{address.phone}</p> : null}
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => beginEdit(address)}
                                >
                                    <Edit3 className="size-3.5" />
                                    Edit
                                </Button>

                                {!address.is_default && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => makeDefault(address)}
                                    >
                                        <Star className="size-3.5" />
                                        Set Default
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removeAddress(address)}
                                >
                                    <Trash2 className="size-3.5" />
                                    Delete
                                </Button>
                            </div>
                        </article>
                    ))}
                </section>
            </div>
        </AppLayout>
    );
}
