import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import MarketingLayout from '@/layouts/marketing-layout';

type PageProps = {
    flash?: {
        error?: string;
        success?: string;
    };
    error?: string;
    success?: string;
};

type CartItem = {
    product_id: number;
    name: string;
    slug: string;
    unit_price_cents: number;
    unit_price: string;
    qty: number;
    line_total_cents: number;
    line_total: string;

    // Şimdilik backend göndermiyor olabilir; UI kırılmasın diye optional
    image_url?: string | null;
    image_alt?: string | null;

    // İleride varyant/özellik gelirse hazır dursun
    variant_1?: string | null;
    variant_2?: string | null;
};

type CartSummary = {
    items_count: number;
    unique_items_count: number;
    subtotal_cents: number;
    subtotal: string;
};

type Props = {
    cart: {
        items: CartItem[];
        summary: CartSummary;
    };
};

type CheckoutForm = {
    // Contact
    email: string;

    // Payment (UI)
    payment_method: 'card' | 'paypal' | 'etransfer';
    card_name: string;
    card_number: string;
    card_expiry: string;
    card_cvc: string;

    // Shipping
    first_name: string;
    last_name: string;
    company: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;

    // Billing
    billing_same_as_shipping: boolean;
};

function formatMoneyFromCents(cents: number) {
    const value = Math.round(cents) / 100;
    return value.toFixed(2);
}

export default function CheckoutIndex({ cart }: Props) {
    const { props } = usePage<PageProps>();
    const flashError = props.error ?? props.flash?.error;
    const flashSuccess = props.success ?? props.flash?.success;

    // Cart optimistic UI (qty/remove)
    const [qtyByProduct, setQtyByProduct] = useState<Record<number, number>>(
        {},
    );

    const shippingCents = 500;
    const taxRate = 0.084;

    const derived = useMemo(() => {
        const items = cart.items.map((item) => {
            const qty = qtyByProduct[item.product_id] ?? item.qty;
            const lineTotalCents = item.unit_price_cents * qty;
            return { ...item, qty, line_total_cents: lineTotalCents };
        });

        const itemsCount = items.reduce((acc, it) => acc + it.qty, 0);
        const subtotalCents = items.reduce(
            (acc, it) => acc + it.line_total_cents,
            0,
        );

        return { items, itemsCount, subtotalCents };
    }, [cart.items, qtyByProduct]);

    const taxCents = useMemo(
        () => Math.round(derived.subtotalCents * taxRate),
        [derived.subtotalCents],
    );
    const totalCents = derived.subtotalCents + shippingCents + taxCents;
    const isEmpty = derived.items.length === 0;

    const form = useForm<CheckoutForm>({
        email: '',

        payment_method: 'card',
        card_name: '',
        card_number: '',
        card_expiry: '',
        card_cvc: '',

        first_name: '',
        last_name: '',
        company: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'Germany',

        billing_same_as_shipping: true,
    });

    const patchQty = (productId: number, nextQty: number, prevQty: number) => {
        router.patch(
            `/cart/items/${productId}`,
            { qty: nextQty },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onError: () => {
                    setQtyByProduct((prev) => ({
                        ...prev,
                        [productId]: prevQty,
                    }));
                },
                onSuccess: () => {
                    setQtyByProduct((prev) => {
                        const copy = { ...prev };
                        delete copy[productId];
                        return copy;
                    });
                },
            },
        );
    };

    const onQtyChange = (productId: number, nextQty: number) => {
        const prevQty =
            qtyByProduct[productId] ??
            cart.items.find((i) => i.product_id === productId)?.qty ??
            1;
        setQtyByProduct((prev) => ({ ...prev, [productId]: nextQty }));
        patchQty(productId, nextQty, prevQty);
    };

    const onRemove = (productId: number) => {
        router.delete(`/cart/items/${productId}`, {
            preserveScroll: true,
            replace: true,
            onSuccess: () => {
                setQtyByProduct((prev) => {
                    const copy = { ...prev };
                    delete copy[productId];
                    return copy;
                });
            },
        });
    };

    return (
        <MarketingLayout>
            <Head title="Checkout" />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Checkout
                    </h1>

                    <Link
                        href="/cart"
                        className="text-sm text-gray-600 hover:underline dark:text-gray-300"
                    >
                        &larr; Back to cart
                    </Link>
                </div>

                {(flashError || flashSuccess) && (
                    <div className="mt-6 space-y-2">
                        {flashError && (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                                {flashError}
                            </div>
                        )}
                        {flashSuccess && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200">
                                {flashSuccess}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start">
                    {/* LEFT */}
                    <section className="lg:col-span-7">
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Contact information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {isEmpty ? (
                                    <div className="rounded-xl border border-dashed border-gray-200 p-6 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                                        Your cart is empty.{' '}
                                        <Link
                                            href="/products"
                                            className="font-medium text-gray-900 hover:underline dark:text-white"
                                        >
                                            Continue shopping &rarr;
                                        </Link>
                                    </div>
                                ) : (
                                    <form
                                        onSubmit={(e) => {
                                            e.preventDefault();
                                            // Backend sadece shipping alanlarını zorunlu validate ediyor.
                                            // Email’i backend’de de kullanmak istiyorsan CheckoutStoreRequest + controller’da bağlarız.
                                            form.post('/checkout', {
                                                preserveScroll: true,
                                            });
                                        }}
                                        className="space-y-10"
                                    >
                                        {/* Contact */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email">
                                                Email address
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={form.data.email}
                                                onChange={(e) =>
                                                    form.setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                                autoComplete="email"
                                            />
                                            {/* Backend validasyonunda email var/yok değişebilir; şimdilik errors gösteriyoruz */}
                                            <InputError
                                                message={form.errors.email}
                                            />
                                        </div>

                                        <Separator />

                                        {/* Payment */}
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between">
                                                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                                    Payment details
                                                </h2>
                                            </div>

                                            <div className="flex flex-wrap gap-6 text-sm">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        checked={
                                                            form.data
                                                                .payment_method ===
                                                            'card'
                                                        }
                                                        onChange={() =>
                                                            form.setData(
                                                                'payment_method',
                                                                'card',
                                                            )
                                                        }
                                                    />
                                                    Credit card
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        checked={
                                                            form.data
                                                                .payment_method ===
                                                            'paypal'
                                                        }
                                                        onChange={() =>
                                                            form.setData(
                                                                'payment_method',
                                                                'paypal',
                                                            )
                                                        }
                                                    />
                                                    PayPal
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        checked={
                                                            form.data
                                                                .payment_method ===
                                                            'etransfer'
                                                        }
                                                        onChange={() =>
                                                            form.setData(
                                                                'payment_method',
                                                                'etransfer',
                                                            )
                                                        }
                                                    />
                                                    eTransfer
                                                </label>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="card_name">
                                                        Name on card
                                                    </Label>
                                                    <Input
                                                        id="card_name"
                                                        value={
                                                            form.data.card_name
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'card_name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="cc-name"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="card_number">
                                                        Card number
                                                    </Label>
                                                    <Input
                                                        id="card_number"
                                                        value={
                                                            form.data
                                                                .card_number
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'card_number',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="cc-number"
                                                        inputMode="numeric"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                                    <div className="space-y-2 sm:col-span-2">
                                                        <Label htmlFor="card_expiry">
                                                            Expiration date
                                                            (MM/YY)
                                                        </Label>
                                                        <Input
                                                            id="card_expiry"
                                                            value={
                                                                form.data
                                                                    .card_expiry
                                                            }
                                                            onChange={(e) =>
                                                                form.setData(
                                                                    'card_expiry',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            autoComplete="cc-exp"
                                                            placeholder="MM/YY"
                                                        />
                                                    </div>

                                                    <div className="space-y-2 sm:col-span-1">
                                                        <Label htmlFor="card_cvc">
                                                            CVC
                                                        </Label>
                                                        <Input
                                                            id="card_cvc"
                                                            value={
                                                                form.data
                                                                    .card_cvc
                                                            }
                                                            onChange={(e) =>
                                                                form.setData(
                                                                    'card_cvc',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            autoComplete="cc-csc"
                                                            inputMode="numeric"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Shipping */}
                                        <div className="space-y-6">
                                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                                Shipping address
                                            </h2>

                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="space-y-2">
                                                    <Label htmlFor="first_name">
                                                        First name
                                                    </Label>
                                                    <Input
                                                        id="first_name"
                                                        value={
                                                            form.data.first_name
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'first_name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="given-name"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors
                                                                .first_name
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="last_name">
                                                        Last name
                                                    </Label>
                                                    <Input
                                                        id="last_name"
                                                        value={
                                                            form.data.last_name
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'last_name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="family-name"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors
                                                                .last_name
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2 sm:col-span-2">
                                                    <Label htmlFor="company">
                                                        Company
                                                    </Label>
                                                    <Input
                                                        id="company"
                                                        value={
                                                            form.data.company
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'company',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="organization"
                                                    />
                                                </div>

                                                <div className="space-y-2 sm:col-span-2">
                                                    <Label htmlFor="address1">
                                                        Address
                                                    </Label>
                                                    <Input
                                                        id="address1"
                                                        value={
                                                            form.data.address1
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'address1',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="address-line1"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors.address1
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2 sm:col-span-2">
                                                    <Label htmlFor="address2">
                                                        Apartment, suite, etc.
                                                    </Label>
                                                    <Input
                                                        id="address2"
                                                        value={
                                                            form.data.address2
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'address2',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="address-line2"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors.address2
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2 sm:col-span-2">
                                                    <Label htmlFor="city">
                                                        City
                                                    </Label>
                                                    <Input
                                                        id="city"
                                                        value={form.data.city}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'city',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="address-level2"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors.city
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="state">
                                                        State / Province
                                                    </Label>
                                                    <Input
                                                        id="state"
                                                        value={form.data.state}
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'state',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="address-level1"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="postal_code">
                                                        Postal code
                                                    </Label>
                                                    <Input
                                                        id="postal_code"
                                                        value={
                                                            form.data
                                                                .postal_code
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'postal_code',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="postal-code"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors
                                                                .postal_code
                                                        }
                                                    />
                                                </div>

                                                <div className="space-y-2 sm:col-span-2">
                                                    <Label htmlFor="country">
                                                        Country
                                                    </Label>
                                                    <Input
                                                        id="country"
                                                        value={
                                                            form.data.country
                                                        }
                                                        onChange={(e) =>
                                                            form.setData(
                                                                'country',
                                                                e.target.value,
                                                            )
                                                        }
                                                        autoComplete="country-name"
                                                    />
                                                    <InputError
                                                        message={
                                                            form.errors.country
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Billing */}
                                        <div className="space-y-4">
                                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                                Billing information
                                            </h2>

                                            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                                                <Checkbox
                                                    checked={
                                                        form.data
                                                            .billing_same_as_shipping
                                                    }
                                                    onCheckedChange={(v) =>
                                                        form.setData(
                                                            'billing_same_as_shipping',
                                                            v === true,
                                                        )
                                                    }
                                                />
                                                Same as shipping information
                                            </label>
                                        </div>

                                        <Separator />

                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                You won&apos;t be charged until
                                                the next step.
                                            </p>

                                            <Button
                                                type="submit"
                                                disabled={form.processing}
                                                className="rounded-xl px-6"
                                            >
                                                {form.processing
                                                    ? 'Continuing…'
                                                    : 'Continue'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    {/* RIGHT */}
                    <aside className="lg:sticky lg:top-24 lg:col-span-5">
                        <Card className="rounded-2xl">
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    Order summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isEmpty ? (
                                    <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
                                        No items.
                                    </div>
                                ) : (
                                    <>
                                        <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                                            {derived.items.map((item) => (
                                                <li
                                                    key={item.product_id}
                                                    className="py-5"
                                                >
                                                    <div className="flex gap-4">
                                                        <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                                                            {item.image_url ? (
                                                                <img
                                                                    src={
                                                                        item.image_url
                                                                    }
                                                                    alt={
                                                                        item.image_alt ??
                                                                        item.name
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                    loading="lazy"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full" />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <Link
                                                                        href={`/products/${item.slug}`}
                                                                        className="truncate font-medium text-gray-900 hover:underline dark:text-white"
                                                                    >
                                                                        {
                                                                            item.name
                                                                        }
                                                                    </Link>

                                                                    {(item.variant_1 ||
                                                                        item.variant_2) && (
                                                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                            {item.variant_1 && (
                                                                                <span>
                                                                                    {
                                                                                        item.variant_1
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            {item.variant_1 &&
                                                                                item.variant_2 && (
                                                                                    <span className="mx-2">
                                                                                        |
                                                                                    </span>
                                                                                )}
                                                                            {item.variant_2 && (
                                                                                <span>
                                                                                    {
                                                                                        item.variant_2
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    <div className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                                                        €{' '}
                                                                        {formatMoneyFromCents(
                                                                            item.unit_price_cents,
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        onRemove(
                                                                            item.product_id,
                                                                        )
                                                                    }
                                                                    className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-900 dark:hover:text-gray-200"
                                                                    aria-label="Remove"
                                                                    title="Remove"
                                                                >
                                                                    <Trash2 className="h-5 w-5" />
                                                                </button>
                                                            </div>

                                                            <div className="mt-4 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Label
                                                                        htmlFor={`qty-${item.product_id}`}
                                                                        className="sr-only"
                                                                    >
                                                                        Quantity
                                                                    </Label>
                                                                    <select
                                                                        id={`qty-${item.product_id}`}
                                                                        value={
                                                                            item.qty
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            onQtyChange(
                                                                                item.product_id,
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ),
                                                                            )
                                                                        }
                                                                        className="h-9 w-20 rounded-md border border-gray-300 bg-white px-2 text-sm text-gray-900 shadow-sm focus:ring-2 focus:ring-gray-900/20 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                                                                    >
                                                                        {Array.from(
                                                                            {
                                                                                length: 10,
                                                                            },
                                                                        ).map(
                                                                            (
                                                                                _,
                                                                                i,
                                                                            ) => {
                                                                                const v =
                                                                                    i +
                                                                                    1;
                                                                                return (
                                                                                    <option
                                                                                        key={
                                                                                            v
                                                                                        }
                                                                                        value={
                                                                                            v
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            v
                                                                                        }
                                                                                    </option>
                                                                                );
                                                                            },
                                                                        )}
                                                                    </select>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        × €{' '}
                                                                        {formatMoneyFromCents(
                                                                            item.unit_price_cents,
                                                                        )}
                                                                    </span>
                                                                </div>

                                                                <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                    €{' '}
                                                                    {formatMoneyFromCents(
                                                                        item.line_total_cents,
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    Subtotal
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    €{' '}
                                                    {formatMoneyFromCents(
                                                        derived.subtotalCents,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    Shipping
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    €{' '}
                                                    {formatMoneyFromCents(
                                                        shippingCents,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    Taxes
                                                </span>
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    €{' '}
                                                    {formatMoneyFromCents(
                                                        taxCents,
                                                    )}
                                                </span>
                                            </div>

                                            <Separator />

                                            <div className="flex items-center justify-between text-base">
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    Total
                                                </span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    €{' '}
                                                    {formatMoneyFromCents(
                                                        totalCents,
                                                    )}
                                                </span>
                                            </div>

                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Items: {derived.itemsCount} •
                                                Unique: {derived.items.length}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </aside>
                </div>
            </div>
        </MarketingLayout>
    );
}
