import { Head, router, useForm, usePage } from '@inertiajs/react';
import { CreditCard, Edit3, Plus, Star, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import {
    destroy as destroyPaymentMethod,
    index as paymentMethodsIndex,
    setDefault as setDefaultPaymentMethod,
    store as storePaymentMethod,
    update as updatePaymentMethod,
} from '@/routes/account/payment-methods';
import type { BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { type FormEvent, useMemo, useState } from 'react';

type PaymentMethod = {
    id: number;
    label: string | null;
    card_holder_name: string;
    brand: string;
    last_four: string;
    expiry_month: number;
    expiry_year: number;
    is_default: boolean;
};

type PaymentMethodFormData = {
    label: string;
    card_holder_name: string;
    card_number: string;
    cvc: string;
    expiry_month: string;
    expiry_year: string;
    is_default: boolean;
};

const emptyPaymentMethodForm: PaymentMethodFormData = {
    label: '',
    card_holder_name: '',
    card_number: '',
    cvc: '',
    expiry_month: '',
    expiry_year: '',
    is_default: false,
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payment Methods', href: paymentMethodsIndex().url },
];

export default function PaymentMethodsIndex() {
    const { paymentMethods } = usePage<{ paymentMethods: PaymentMethod[] }>().props;
    const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<number | null>(null);
    const [formVisible, setFormVisible] = useState(paymentMethods.length === 0);

    const form = useForm<PaymentMethodFormData>(emptyPaymentMethodForm);

    const isEditing = editingPaymentMethodId !== null;
    const pageTitle = isEditing ? 'Edit Payment Method' : 'Add New Payment Method';
    const primaryActionLabel = isEditing ? 'Update Card' : 'Save Card';

    const sortedPaymentMethods = useMemo(() => {
        return [...paymentMethods].sort((a, b) => {
            if (a.is_default !== b.is_default) {
                return a.is_default ? -1 : 1;
            }

            return b.id - a.id;
        });
    }, [paymentMethods]);

    const beginCreate = (): void => {
        setEditingPaymentMethodId(null);
        form.reset();
        form.clearErrors();
        setFormVisible(true);
    };

    const beginEdit = (paymentMethod: PaymentMethod): void => {
        setEditingPaymentMethodId(paymentMethod.id);
        form.setData({
            label: paymentMethod.label ?? '',
            card_holder_name: paymentMethod.card_holder_name,
            card_number: '',
            cvc: '',
            expiry_month: String(paymentMethod.expiry_month),
            expiry_year: String(paymentMethod.expiry_year),
            is_default: paymentMethod.is_default,
        });
        form.clearErrors();
        setFormVisible(true);
    };

    const cancelForm = (): void => {
        setEditingPaymentMethodId(null);
        form.reset();
        form.clearErrors();
        setFormVisible(paymentMethods.length === 0);
    };

    const onlyDigits = (value: string, maxLength: number): string => {
        return value.replace(/\D/g, '').slice(0, maxLength);
    };

    const formatCardNumber = (value: string): string => {
        const digits = onlyDigits(value, 16);

        return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    };

    const submit = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                setEditingPaymentMethodId(null);
                form.reset();
                form.clearErrors();
                setFormVisible(false);
            },
        };

        if (editingPaymentMethodId === null) {
            form.post(storePaymentMethod().url, options);

            return;
        }

        form.patch(updatePaymentMethod(editingPaymentMethodId).url, options);
    };

    const removePaymentMethod = (paymentMethod: PaymentMethod): void => {
        if (!window.confirm('Delete this payment method?')) {
            return;
        }

        router.delete(destroyPaymentMethod(paymentMethod.id).url, {
            preserveScroll: true,
        });
    };

    const makeDefault = (paymentMethod: PaymentMethod): void => {
        if (paymentMethod.is_default) {
            return;
        }

        router.patch(
            setDefaultPaymentMethod(paymentMethod.id).url,
            {},
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Payment Methods" />

            <div className="space-y-6 p-4">
                <section className="overflow-hidden rounded-2xl border bg-gradient-to-br from-sky-50 via-cyan-50 to-emerald-50">
                    <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-2">
                            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                                Account Wallet
                            </p>
                            <h1 className="text-2xl font-semibold tracking-tight">Payment Methods</h1>
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                Add and manage your cards. Card numbers must be 16 digits and CVC must be 3-4 digits.
                            </p>
                        </div>

                        <Button type="button" onClick={beginCreate} className="self-start sm:self-auto">
                            <Plus className="size-4" />
                            New Card
                        </Button>
                    </div>
                </section>

                {formVisible && (
                    <section className="rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{pageTitle}</h2>
                            {paymentMethods.length > 0 && (
                                <Button type="button" variant="ghost" onClick={cancelForm}>
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
                                        onChange={(event) => form.setData('label', event.target.value)}
                                        placeholder="Primary, Work..."
                                    />
                                    {form.errors.label && (
                                        <p className="text-xs text-destructive">{form.errors.label}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="card_holder_name">Card Holder Name</Label>
                                    <Input
                                        id="card_holder_name"
                                        value={form.data.card_holder_name}
                                        onChange={(event) => form.setData('card_holder_name', event.target.value)}
                                        placeholder="Name Surname"
                                    />
                                    {form.errors.card_holder_name && (
                                        <p className="text-xs text-destructive">{form.errors.card_holder_name}</p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="card_number">Card Number</Label>
                                    <Input
                                        id="card_number"
                                        value={form.data.card_number}
                                        onChange={(event) => form.setData('card_number', formatCardNumber(event.target.value))}
                                        inputMode="numeric"
                                        autoComplete="cc-number"
                                        placeholder={
                                            isEditing
                                                ? 'Leave empty to keep existing card number'
                                                : '16-digit card number'
                                        }
                                    />
                                    {form.errors.card_number && (
                                        <p className="text-xs text-destructive">{form.errors.card_number}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry_month">Expiry Month</Label>
                                    <Input
                                        id="expiry_month"
                                        value={form.data.expiry_month}
                                        onChange={(event) =>
                                            form.setData('expiry_month', onlyDigits(event.target.value, 2))
                                        }
                                        inputMode="numeric"
                                        placeholder="MM"
                                    />
                                    {form.errors.expiry_month && (
                                        <p className="text-xs text-destructive">{form.errors.expiry_month}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiry_year">Expiry Year</Label>
                                    <Input
                                        id="expiry_year"
                                        value={form.data.expiry_year}
                                        onChange={(event) =>
                                            form.setData('expiry_year', onlyDigits(event.target.value, 4))
                                        }
                                        inputMode="numeric"
                                        placeholder="YYYY"
                                    />
                                    {form.errors.expiry_year && (
                                        <p className="text-xs text-destructive">{form.errors.expiry_year}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input
                                        id="cvc"
                                        value={form.data.cvc}
                                        onChange={(event) => form.setData('cvc', onlyDigits(event.target.value, 4))}
                                        inputMode="numeric"
                                        placeholder={isEditing ? 'Optional when not changing card' : '123'}
                                    />
                                    {form.errors.cvc && (
                                        <p className="text-xs text-destructive">{form.errors.cvc}</p>
                                    )}
                                </div>
                            </div>

                            <label className="flex items-center gap-3 rounded-md border bg-muted/30 px-3 py-2">
                                <Checkbox
                                    checked={form.data.is_default}
                                    onCheckedChange={(checked) => form.setData('is_default', checked === true)}
                                />
                                <span className="text-sm font-medium">
                                    Set as default payment method
                                </span>
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" disabled={form.processing}>
                                    {primaryActionLabel}
                                </Button>
                                {paymentMethods.length > 0 && (
                                    <Button type="button" variant="outline" onClick={cancelForm}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>
                    </section>
                )}

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {sortedPaymentMethods.length === 0 && !formVisible && (
                        <div className="col-span-full rounded-2xl border border-dashed bg-muted/20 p-8 text-center">
                            <CreditCard className="mx-auto mb-3 size-6 text-muted-foreground" />
                            <h3 className="text-base font-semibold">No cards saved</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add your first card to speed up checkout.
                            </p>
                            <Button type="button" className="mt-4" onClick={beginCreate}>
                                Add Card
                            </Button>
                        </div>
                    )}

                    {sortedPaymentMethods.map((paymentMethod) => (
                        <article
                            key={paymentMethod.id}
                            className={cn(
                                'rounded-2xl border bg-card p-5 shadow-sm transition',
                                paymentMethod.is_default && 'border-sky-300 bg-sky-50/40',
                            )}
                        >
                            <div className="mb-4 flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                                        {paymentMethod.label ?? 'Card'}
                                    </p>
                                    <h3 className="text-base font-semibold">
                                        {paymentMethod.brand} •••• {paymentMethod.last_four}
                                    </h3>
                                </div>

                                {paymentMethod.is_default ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800">
                                        <Star className="size-3.5" />
                                        Default
                                    </span>
                                ) : null}
                            </div>

                            <div className="space-y-1.5 text-sm text-muted-foreground">
                                <p className="text-foreground">{paymentMethod.card_holder_name}</p>
                                <p>
                                    Expires {String(paymentMethod.expiry_month).padStart(2, '0')}/
                                    {paymentMethod.expiry_year}
                                </p>
                            </div>

                            <div className="mt-5 flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => beginEdit(paymentMethod)}
                                >
                                    <Edit3 className="size-3.5" />
                                    Edit
                                </Button>

                                {!paymentMethod.is_default && (
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => makeDefault(paymentMethod)}
                                    >
                                        <Star className="size-3.5" />
                                        Set Default
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => removePaymentMethod(paymentMethod)}
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
