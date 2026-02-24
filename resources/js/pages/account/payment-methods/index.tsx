import { useForm, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

import {
    store,
    update,
    destroy,
    setDefault,
} from '@/actions/App/Http/Controllers/Account/PaymentMethodController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = {
    id: number;
    brand: string;
    last4: string;
    cardholder_name: string;
    exp_month: number;
    exp_year: number;
    is_default: boolean;
};

type FormData = {
    card_number: string;
    brand: string;
    cardholder_name: string;
    exp_month: string;
    exp_year: string;
};

type Props = {
    paymentMethods: PaymentMethod[];
};

// ─── Constants ───────────────────────────────────────────────────────────────

const BRANDS = [
    { value: 'visa', label: 'Visa' },
    { value: 'mastercard', label: 'Mastercard' },
    { value: 'amex', label: 'American Express' },
    { value: 'discover', label: 'Discover' },
    { value: 'troy', label: 'Troy' },
];

const BRAND_STYLES: Record<string, string> = {
    visa: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    mastercard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    amex: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    discover:
        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    troy: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
};

const MONTHS = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    return { value: String(m), label: String(m).padStart(2, '0') };
});

const YEARS = Array.from({ length: 10 }, (_, i) => {
    const y = new Date().getFullYear() + i;
    return { value: String(y), label: String(y) };
});

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Payment Methods', href: '/account/payment-methods' },
];

const emptyForm: FormData = {
    card_number: '',
    brand: '',
    cardholder_name: '',
    exp_month: '',
    exp_year: '',
};

// ─── Card Number Helpers ─────────────────────────────────────────────────────

function detectBrand(digits: string): string {
    if (/^4/.test(digits)) return 'visa';
    if (/^(5[1-5]|2[2-7]\d{2})/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    if (/^(6011|65|64[4-9]|622)/.test(digits)) return 'discover';
    if (/^9792/.test(digits)) return 'troy';
    return '';
}

function formatCardNumber(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (/^3[47]/.test(digits)) {
        // Amex: 4-6-5
        return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)]
            .filter(Boolean)
            .join(' ');
    }
    // Default: 4-4-4-4
    return (digits.match(/.{1,4}/g) ?? []).join(' ');
}

// ─── Card Form ────────────────────────────────────────────────────────────────

function CardForm({
    data,
    errors,
    processing,
    setData,
    onSubmit,
    onCancel,
    submitLabel,
    cardHint,
}: {
    data: FormData;
    errors: Partial<Record<keyof FormData, string>>;
    processing: boolean;
    setData: (key: keyof FormData, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    submitLabel: string;
    cardHint?: string;
}) {
    const digits = data.card_number.replace(/\D/g, '');
    const autoBrand = detectBrand(digits);
    const displayBrand = autoBrand || data.brand;
    const isAmex = displayBrand === 'amex';
    const maxLength = isAmex ? 17 : 19; // digits + spaces

    return (
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            {/* Card number */}
            <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="card_number">Card number</Label>
                <div className="relative">
                    <Input
                        id="card_number"
                        value={data.card_number}
                        onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            const detected = detectBrand(
                                formatted.replace(/\D/g, ''),
                            );
                            setData('card_number', formatted);
                            if (detected) setData('brand', detected);
                        }}
                        maxLength={maxLength}
                        placeholder={
                            cardHint ??
                            (isAmex
                                ? '•••• •••••• •••••'
                                : '•••• •••• •••• ••••')
                        }
                        inputMode="numeric"
                        autoComplete="cc-number"
                        className="pr-24 font-mono tracking-widest"
                    />
                    {displayBrand && (
                        <span
                            className={`absolute top-1/2 right-3 -translate-y-1/2 rounded px-2 py-0.5 text-xs font-semibold capitalize ${
                                BRAND_STYLES[displayBrand] ?? ''
                            }`}
                        >
                            {displayBrand}
                        </span>
                    )}
                </div>
                <InputError message={errors.card_number} />
            </div>

            {/* Brand — shown when auto-detect is uncertain */}
            {!autoBrand && (
                <div className="col-span-full flex flex-col gap-1.5">
                    <Label htmlFor="brand">Card type</Label>
                    <Select
                        value={data.brand}
                        onValueChange={(v) => setData('brand', v)}
                    >
                        <SelectTrigger id="brand">
                            <SelectValue placeholder="Select card type" />
                        </SelectTrigger>
                        <SelectContent>
                            {BRANDS.map((b) => (
                                <SelectItem key={b.value} value={b.value}>
                                    {b.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.brand} />
                </div>
            )}

            {/* Cardholder */}
            <div className="col-span-full flex flex-col gap-1.5">
                <Label htmlFor="cardholder_name">Cardholder name</Label>
                <Input
                    id="cardholder_name"
                    value={data.cardholder_name}
                    onChange={(e) => setData('cardholder_name', e.target.value)}
                    placeholder="Jane Doe"
                />
                <InputError message={errors.cardholder_name} />
            </div>

            {/* Exp month */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="exp_month">Expiry month</Label>
                <Select
                    value={data.exp_month}
                    onValueChange={(v) => setData('exp_month', v)}
                >
                    <SelectTrigger id="exp_month">
                        <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent>
                        {MONTHS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.exp_month} />
            </div>

            {/* Exp year */}
            <div className="flex flex-col gap-1.5">
                <Label htmlFor="exp_year">Expiry year</Label>
                <Select
                    value={data.exp_year}
                    onValueChange={(v) => setData('exp_year', v)}
                >
                    <SelectTrigger id="exp_year">
                        <SelectValue placeholder="YYYY" />
                    </SelectTrigger>
                    <SelectContent>
                        {YEARS.map((y) => (
                            <SelectItem key={y.value} value={y.value}>
                                {y.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.exp_year} />
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

export default function PaymentMethodsIndex({ paymentMethods }: Props) {
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

    const startEdit = (m: PaymentMethod) => {
        editForm.setData({
            card_number: '',
            brand: m.brand,
            cardholder_name: m.cardholder_name,
            exp_month: String(m.exp_month),
            exp_year: String(m.exp_year),
        });
        setEditingId(m.id);
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
            <Head title="Payment Methods" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-xl font-semibold">Payment Methods</h1>
                    {!showAddForm && (
                        <Button
                            size="sm"
                            onClick={() => {
                                setShowAddForm(true);
                                setEditingId(null);
                            }}
                        >
                            Add card
                        </Button>
                    )}
                </div>

                {/* Add form */}
                {showAddForm && (
                    <Card>
                        <CardContent className="pt-6">
                            <p className="mb-4 font-medium">
                                New payment method
                            </p>
                            <CardForm
                                data={addForm.data}
                                errors={addForm.errors}
                                processing={addForm.processing}
                                setData={(k, v) => addForm.setData(k, v)}
                                onSubmit={submitAdd}
                                onCancel={() => {
                                    setShowAddForm(false);
                                    addForm.reset();
                                }}
                                submitLabel="Save card"
                            />
                        </CardContent>
                    </Card>
                )}

                {/* Empty state */}
                {paymentMethods.length === 0 && !showAddForm && (
                    <div className="flex h-[40vh] items-center justify-center rounded-xl border border-dashed">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            No payment methods saved yet.
                        </p>
                    </div>
                )}

                {/* Method cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paymentMethods.map((method) => (
                        <Card key={method.id}>
                            <CardContent className="pt-6">
                                {editingId === method.id ? (
                                    <CardForm
                                        data={editForm.data}
                                        errors={editForm.errors}
                                        processing={editForm.processing}
                                        setData={(k, v) =>
                                            editForm.setData(k, v)
                                        }
                                        onSubmit={(e) =>
                                            submitEdit(e, method.id)
                                        }
                                        onCancel={() => setEditingId(null)}
                                        submitLabel="Update"
                                        cardHint={`•••• •••• •••• ${method.last4}`}
                                    />
                                ) : (
                                    <>
                                        {/* Brand + default badge */}
                                        <div className="mb-3 flex items-center gap-2">
                                            <span
                                                className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${BRAND_STYLES[method.brand] ?? 'bg-gray-100 text-gray-800'}`}
                                            >
                                                {method.brand}
                                            </span>
                                            {method.is_default && (
                                                <Badge variant="secondary">
                                                    Default
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Masked number */}
                                        <p className="font-mono text-sm tracking-widest">
                                            •••• •••• •••• {method.last4}
                                        </p>

                                        {/* Cardholder */}
                                        <p className="mt-1 text-sm">
                                            {method.cardholder_name}
                                        </p>

                                        {/* Expiry */}
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Exp.{' '}
                                            {String(method.exp_month).padStart(
                                                2,
                                                '0',
                                            )}
                                            /{method.exp_year}
                                        </p>

                                        {/* Actions */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    startEdit(method)
                                                }
                                            >
                                                Edit
                                            </Button>

                                            {!method.is_default && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        router.patch(
                                                            setDefault(
                                                                method.id,
                                                            ).url,
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
                                                        destroy(method.id).url,
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
