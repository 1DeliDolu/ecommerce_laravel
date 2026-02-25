import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { CircleCheck, CircleHelp, CircleMinus, CreditCard, ShoppingBag, User, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/hooks/use-cart';
import MarketingLayout from '@/layouts/marketing-layout';
import { checkout as cartCheckout } from '@/routes/cart';
import { index as shopIndex } from '@/routes/shop';

type PageProps = {
    auth?: {
        user?: {
            name?: string;
            email?: string;
        } | null;
        default_address?: {
            first_name: string;
            last_name: string;
            phone?: string | null;
            line1: string;
            city: string;
            postal_code: string;
            country: string;
        } | null;
        default_payment_method?: {
            id: number;
            label?: string | null;
            card_holder_name: string;
            brand: string;
            last_four: string;
            expiry_month: number;
            expiry_year: number;
        } | null;
    };
};

type CheckoutFormData = {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postal_code: string;
    country: string;
    accepted: boolean;
    payment_method_id: number | null;
    card_holder_name: string;
    card_number: string;
    cvc: string;
    expiry_month: string;
    expiry_year: string;
    items: Array<{
        id: number;
        quantity: number;
        variant_key?: string | null;
        selected_options?: {
            brand?: string;
            model?: string;
            product_type?: string;
            clothing_size?: string;
            shoe_size?: string;
            color?: string;
            material?: string;
        } | null;
    }>;
};

export default function CartIndex() {
    const { auth } = usePage<PageProps>().props;
    const { items, updateItemQuantity, removeItem, clearCart } = useCart();
    const [deselectedLineIds, setDeselectedLineIds] = useState<string[]>([]);

    const defaultAddress = auth?.default_address ?? null;
    const defaultPaymentMethod = auth?.default_payment_method ?? null;

    const defaultFullName = defaultAddress
        ? `${defaultAddress.first_name} ${defaultAddress.last_name}`
        : auth?.user?.name ?? '';

    const [useSavedPaymentMethod, setUseSavedPaymentMethod] = useState(
        defaultPaymentMethod !== null,
    );

    const form = useForm<CheckoutFormData>({
        full_name: defaultFullName,
        email: auth?.user?.email ?? '',
        phone: defaultAddress?.phone ?? '',
        address: defaultAddress?.line1 ?? '',
        city: defaultAddress?.city ?? '',
        postal_code: defaultAddress?.postal_code ?? '',
        country: defaultAddress?.country ?? '',
        accepted: true,
        payment_method_id: defaultPaymentMethod?.id ?? null,
        card_holder_name: defaultPaymentMethod?.card_holder_name ?? defaultFullName,
        card_number:
            defaultPaymentMethod !== null
                ? `**** **** **** ${defaultPaymentMethod.last_four}`
                : '',
        cvc: '',
        expiry_month:
            defaultPaymentMethod !== null
                ? String(defaultPaymentMethod.expiry_month).padStart(2, '0')
                : '',
        expiry_year:
            defaultPaymentMethod !== null
                ? String(defaultPaymentMethod.expiry_year)
                : '',
        items: [],
    });

    const selectedItems = useMemo(() => {
        return items.filter((item) => !deselectedLineIds.includes(item.line_id));
    }, [items, deselectedLineIds]);

    const subtotal = useMemo(() => {
        return selectedItems.reduce((total, item) => {
            return total + item.price * item.quantity;
        }, 0);
    }, [selectedItems]);

    const shipping = selectedItems.length > 0 ? 5 : 0;
    const tax = subtotal * 0.084;
    const total = subtotal + shipping + tax;

    const setItemSelected = (lineId: string, checked: boolean): void => {
        setDeselectedLineIds((previous) => {
            if (checked) {
                return previous.filter((currentId) => currentId !== lineId);
            }

            return previous.includes(lineId) ? previous : [...previous, lineId];
        });
    };

    const hasManualPaymentDetails =
        form.data.card_holder_name.trim() !== '' &&
        form.data.card_number.trim() !== '' &&
        form.data.cvc.trim() !== '' &&
        form.data.expiry_month.trim() !== '' &&
        form.data.expiry_year.trim() !== '';

    const canCheckout =
        selectedItems.length > 0 &&
        form.data.accepted &&
        form.data.full_name.trim() !== '' &&
        form.data.email.trim() !== '' &&
        form.data.address.trim() !== '' &&
        form.data.city.trim() !== '' &&
        form.data.postal_code.trim() !== '' &&
        form.data.country.trim() !== '' &&
        (useSavedPaymentMethod
            ? form.data.payment_method_id !== null
            : hasManualPaymentDetails);

    const formatCurrency = (value: number): string => {
        return `$${value.toFixed(2)}`;
    };

    const onlyDigits = (value: string, maxLength: number): string => {
        return value.replace(/\D/g, '').slice(0, maxLength);
    };

    const formatCardNumber = (value: string): string => {
        const digits = onlyDigits(value, 16);

        return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    };

    const toggleSavedPaymentMethod = (checked: boolean): void => {
        if (defaultPaymentMethod === null) {
            return;
        }

        setUseSavedPaymentMethod(checked);

        if (checked) {
            form.setData({
                ...form.data,
                payment_method_id: defaultPaymentMethod.id,
                card_holder_name: defaultPaymentMethod.card_holder_name,
                card_number: `**** **** **** ${defaultPaymentMethod.last_four}`,
                cvc: '',
                expiry_month: String(defaultPaymentMethod.expiry_month).padStart(2, '0'),
                expiry_year: String(defaultPaymentMethod.expiry_year),
            });
        } else {
            form.setData({
                ...form.data,
                payment_method_id: null,
                card_number: '',
                cvc: '',
            });
        }

        form.clearErrors(
            'payment_method_id',
            'card_holder_name',
            'card_number',
            'cvc',
            'expiry_month',
            'expiry_year',
        );
    };

    const submitCheckout = (): void => {
        if (!canCheckout || form.processing) {
            return;
        }

        form.transform((data) => ({
            ...data,
            payment_method_id: useSavedPaymentMethod ? data.payment_method_id : null,
            card_number: useSavedPaymentMethod ? '' : data.card_number,
            cvc: useSavedPaymentMethod ? '' : data.cvc,
            items: selectedItems.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                variant_key: item.variant_key ?? null,
                selected_options: item.selected_options ?? null,
            })),
        }));

        form.post(cartCheckout().url, {
            preserveScroll: true,
            onSuccess: () => {
                clearCart();
                setDeselectedLineIds([]);
            },
            onFinish: () => {
                form.transform((data) => data);
            },
        });
    };

    return (
        <MarketingLayout title="Shopping Cart">
            <Head title="Shopping Cart" />

            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-semibold tracking-tight">
                    Shopping Cart
                </h1>

                <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_370px]">
                    <section className="space-y-6">
                        {items.length === 0 ? (
                            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                Your cart is empty.{' '}
                                <Link href={shopIndex()} className="font-medium underline">
                                    Go to shop
                                </Link>
                                .
                            </div>
                        ) : (
                            items.map((item) => (
                                <article
                                    key={item.line_id}
                                    className="border-b border-border pb-6"
                                >
                                    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
                                        <div className="flex gap-4">
                                            <div className="pt-1">
                                                <Checkbox
                                                    checked={!deselectedLineIds.includes(item.line_id)}
                                                    onCheckedChange={(checked) =>
                                                        setItemSelected(
                                                            item.line_id,
                                                            checked === true,
                                                        )
                                                    }
                                                />
                                            </div>

                                            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-muted">
                                                {item.image_url ? (
                                                    <img
                                                        src={item.image_url}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                                        <ShoppingBag className="mr-1 size-4" />
                                                        No image
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <h2 className="text-base font-medium">
                                                    {item.name}
                                                </h2>
                                                <p className="text-sm text-muted-foreground">
                                                    {item.slug}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                                    {item.selected_options?.brand ? (
                                                        <span className="inline-flex rounded-full border px-2 py-0.5">
                                                            {item.selected_options.brand}
                                                        </span>
                                                    ) : null}
                                                    {item.selected_options?.model ? (
                                                        <span className="inline-flex rounded-full border px-2 py-0.5">
                                                            {item.selected_options.model}
                                                        </span>
                                                    ) : null}
                                                    {item.selected_options?.clothing_size ? (
                                                        <span className="inline-flex rounded-full border px-2 py-0.5">
                                                            Size {item.selected_options.clothing_size}
                                                        </span>
                                                    ) : null}
                                                    {item.selected_options?.shoe_size ? (
                                                        <span className="inline-flex rounded-full border px-2 py-0.5">
                                                            EU {item.selected_options.shoe_size}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <p className="text-lg font-semibold">
                                                    {formatCurrency(item.price)}
                                                </p>

                                                <div className="mt-8 flex items-center gap-2 text-sm">
                                                    {(item.stock ?? 1) > 0 ? (
                                                        <>
                                                            <CircleCheck className="size-4 text-emerald-600" />
                                                            <span className="text-emerald-700">
                                                                In stock
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CircleMinus className="size-4 text-slate-400" />
                                                            <span className="text-slate-500">
                                                                Out of stock
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <select
                                                value={item.quantity}
                                                onChange={(event) =>
                                                    updateItemQuantity(
                                                        item.line_id,
                                                        Number(event.target.value),
                                                    )
                                                }
                                                className="h-9 min-w-14 rounded-md border bg-background px-2 text-sm"
                                            >
                                                {[1, 2, 3, 4, 5].map(
                                                    (quantity) => (
                                                        <option
                                                            key={quantity}
                                                            value={quantity}
                                                        >
                                                            {quantity}
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => removeItem(item.line_id)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
                                                aria-label={`Remove ${item.name}`}
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            ))
                        )}
                    </section>

                    <aside className="h-fit rounded-xl border border-border bg-muted/30 p-6 shadow-sm">
                        <h2 className="text-2xl font-semibold">Order summary</h2>

                        <div className="mt-6 space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(subtotal)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-4">
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                    Shipping estimate
                                    <CircleHelp className="size-3.5" />
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(shipping)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-4">
                                <span className="inline-flex items-center gap-1 text-muted-foreground">
                                    Tax estimate
                                    <CircleHelp className="size-3.5" />
                                </span>
                                <span className="font-semibold">
                                    {formatCurrency(tax)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-border pt-4 text-base">
                                <span className="font-semibold">
                                    Order total
                                </span>
                                <span className="font-bold">
                                    {formatCurrency(total)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 space-y-4 rounded-lg border bg-background p-4">
                            <div className="space-y-1">
                                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                                    <User className="size-4" />
                                    1. Customer information
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {auth?.user
                                        ? 'Account data detected. Form fields are prefilled when available.'
                                        : 'Guest checkout is available.'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="full_name">Full name</Label>
                                <Input
                                    id="full_name"
                                    value={form.data.full_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'full_name',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.full_name && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.full_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData('email', event.target.value)
                                    }
                                />
                                {form.errors.email && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={form.data.phone}
                                    onChange={(event) =>
                                        form.setData('phone', event.target.value)
                                    }
                                />
                                {form.errors.phone && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.phone}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 space-y-4 rounded-lg border bg-background p-4">
                            <div className="space-y-1">
                                <p className="text-sm font-semibold">2. Address</p>
                                <p className="text-xs text-muted-foreground">
                                    Default address is auto-filled when available.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={form.data.address}
                                    onChange={(event) =>
                                        form.setData(
                                            'address',
                                            event.target.value,
                                        )
                                    }
                                />
                                {form.errors.address && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.address}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-2 sm:col-span-2">
                                    <Label htmlFor="city">City</Label>
                                    <Input
                                        id="city"
                                        value={form.data.city}
                                        onChange={(event) =>
                                            form.setData('city', event.target.value)
                                        }
                                    />
                                    {form.errors.city && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.city}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="postal_code">
                                        Postal
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input
                                    id="country"
                                    value={form.data.country}
                                    onChange={(event) =>
                                        form.setData('country', event.target.value)
                                    }
                                />
                                {form.errors.country && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.country}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 space-y-4 rounded-lg border bg-background p-4">
                            <div className="space-y-1">
                                <p className="inline-flex items-center gap-2 text-sm font-semibold">
                                    <CreditCard className="size-4" />
                                    3. Payment information
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Default payment method is auto-selected when available.
                                </p>
                            </div>

                            {defaultPaymentMethod && (
                                <label className="flex items-center gap-3 rounded-md border bg-muted/20 p-2">
                                    <Checkbox
                                        checked={useSavedPaymentMethod}
                                        onCheckedChange={(checked) =>
                                            toggleSavedPaymentMethod(
                                                checked === true,
                                            )
                                        }
                                    />
                                    <span className="text-xs">
                                        Use saved card: {defaultPaymentMethod.brand}{' '}
                                        **** {defaultPaymentMethod.last_four}
                                    </span>
                                </label>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="card_holder_name">Card holder name</Label>
                                <Input
                                    id="card_holder_name"
                                    value={form.data.card_holder_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'card_holder_name',
                                            event.target.value,
                                        )
                                    }
                                    disabled={useSavedPaymentMethod}
                                />
                                {form.errors.card_holder_name && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.card_holder_name}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="card_number">Card number</Label>
                                <Input
                                    id="card_number"
                                    value={form.data.card_number}
                                    onChange={(event) =>
                                        form.setData(
                                            'card_number',
                                            formatCardNumber(event.target.value),
                                        )
                                    }
                                    disabled={useSavedPaymentMethod}
                                />
                                {form.errors.card_number && (
                                    <p className="text-xs text-destructive">
                                        {form.errors.card_number}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="cvc">CVC</Label>
                                    <Input
                                        id="cvc"
                                        value={form.data.cvc}
                                        onChange={(event) =>
                                            form.setData(
                                                'cvc',
                                                onlyDigits(event.target.value, 4),
                                            )
                                        }
                                        disabled={useSavedPaymentMethod}
                                    />
                                    {form.errors.cvc && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.cvc}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiry_month">Month</Label>
                                    <Input
                                        id="expiry_month"
                                        value={form.data.expiry_month}
                                        onChange={(event) =>
                                            form.setData(
                                                'expiry_month',
                                                onlyDigits(event.target.value, 2),
                                            )
                                        }
                                        disabled={useSavedPaymentMethod}
                                    />
                                    {form.errors.expiry_month && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.expiry_month}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expiry_year">Year</Label>
                                    <Input
                                        id="expiry_year"
                                        value={form.data.expiry_year}
                                        onChange={(event) =>
                                            form.setData(
                                                'expiry_year',
                                                onlyDigits(event.target.value, 4),
                                            )
                                        }
                                        disabled={useSavedPaymentMethod}
                                    />
                                    {form.errors.expiry_year && (
                                        <p className="text-xs text-destructive">
                                            {form.errors.expiry_year}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {form.errors.payment_method_id && (
                                <p className="text-xs text-destructive">
                                    {form.errors.payment_method_id}
                                </p>
                            )}
                        </div>

                        <label className="mt-4 flex items-center gap-2 rounded-md border bg-muted/30 p-2">
                            <Checkbox
                                checked={form.data.accepted}
                                onCheckedChange={(checked) =>
                                    form.setData('accepted', checked === true)
                                }
                            />
                            <span className="text-xs">
                                I confirm the selected items and complete checkout.
                            </span>
                        </label>
                        {form.errors.accepted && (
                            <p className="mt-2 text-xs text-destructive">
                                {form.errors.accepted}
                            </p>
                        )}
                        {form.errors.items && (
                            <p className="mt-2 text-xs text-destructive">
                                {form.errors.items}
                            </p>
                        )}

                        <Button
                            type="button"
                            disabled={!canCheckout || form.processing}
                            className="mt-5 h-11 w-full text-base font-semibold"
                            onClick={submitCheckout}
                        >
                            {form.processing ? 'Processing...' : 'Checkout'}
                        </Button>
                    </aside>
                </div>
            </div>
        </MarketingLayout>
    );
}
