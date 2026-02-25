import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ShoppingCart } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/use-cart';
import MarketingLayout from '@/layouts/marketing-layout';
import { index as cartIndex } from '@/routes/cart';
import { index as shopIndex } from '@/routes/shop';

type ProductImage = {
    id: number;
    image_url: string;
    alt: string | null;
    is_primary: boolean;
};

type ShopProduct = {
    id: number;
    slug: string;
    name: string;
    brand: string | null;
    model_name: string | null;
    product_type: string | null;
    color: string | null;
    material: string | null;
    available_clothing_sizes: string[];
    available_shoe_sizes: string[];
    description: string | null;
    price: number;
    compare_at_price: number | null;
    stock: number;
    images: ProductImage[];
};

type SelectedOptions = {
    brand?: string;
    model?: string;
    product_type?: string;
    clothing_size?: string;
    shoe_size?: string;
    color?: string;
    material?: string;
};

type Props = {
    product: ShopProduct;
};

export default function ShopView({ product }: Props) {
    const { addItem, itemCount } = useCart();
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [added, setAdded] = useState(false);
    const [quantityInput, setQuantityInput] = useState('1');
    const [selectedClothingSize, setSelectedClothingSize] = useState('');
    const [selectedShoeSize, setSelectedShoeSize] = useState('');

    const selectedImage = useMemo(() => {
        if (product.images.length === 0) {
            return null;
        }

        return product.images[selectedImageIndex] ?? product.images[0];
    }, [product.images, selectedImageIndex]);

    const formatMoney = (price: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(price);
    };

    const normalizeQuantity = (quantity: number): number => {
        if (!Number.isFinite(quantity)) {
            return 1;
        }

        const maxQuantity = Math.max(1, product.stock);

        return Math.min(Math.max(1, Math.floor(quantity)), maxQuantity);
    };

    const resolvedQuantity = normalizeQuantity(Number(quantityInput));
    const requiresClothingSize = product.available_clothing_sizes.length > 0;
    const requiresShoeSize = product.available_shoe_sizes.length > 0;
    const hasMissingOptions =
        (requiresClothingSize && selectedClothingSize === '') ||
        (requiresShoeSize && selectedShoeSize === '');
    const selectedOptions: SelectedOptions = {};

    if (product.brand !== null && product.brand.trim() !== '') {
        selectedOptions.brand = product.brand.trim();
    }

    if (product.model_name !== null && product.model_name.trim() !== '') {
        selectedOptions.model = product.model_name.trim();
    }

    if (product.product_type !== null && product.product_type.trim() !== '') {
        selectedOptions.product_type = product.product_type.trim();
    }

    if (selectedClothingSize !== '') {
        selectedOptions.clothing_size = selectedClothingSize;
    }

    if (selectedShoeSize !== '') {
        selectedOptions.shoe_size = selectedShoeSize;
    }

    if (product.color !== null && product.color.trim() !== '') {
        selectedOptions.color = product.color.trim();
    }

    if (product.material !== null && product.material.trim() !== '') {
        selectedOptions.material = product.material.trim();
    }

    const resolvedVariantKey = [
        String(product.id),
        ...Object.entries(selectedOptions).map(([key, value]) => `${key}:${value}`),
    ].join('|');

    const handleQuantityChange = (value: string): void => {
        if (value === '') {
            setQuantityInput('');

            return;
        }

        const parsed = Number(value);

        if (!Number.isFinite(parsed)) {
            return;
        }

        setQuantityInput(String(Math.max(1, Math.floor(parsed))));
    };

    const addToCart = (): void => {
        if (product.stock <= 0) {
            return;
        }

        addItem({
            id: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            image_url: selectedImage?.image_url ?? null,
            stock: product.stock,
            quantity: resolvedQuantity,
            variant_key: resolvedVariantKey,
            selected_options: selectedOptions,
        });

        setAdded(true);
        setQuantityInput(String(resolvedQuantity));
        window.setTimeout(() => setAdded(false), 1000);
    };

    return (
        <MarketingLayout title={product.name}>
            <Head title={product.name} />

            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={shopIndex()}>
                                <ChevronLeft className="mr-1 size-4" />
                                Shop
                            </Link>
                        </Button>
                        <h1 className="line-clamp-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                            {product.name}
                        </h1>
                    </div>

                    <Button asChild variant="outline">
                        <Link href={cartIndex()}>
                            <ShoppingCart className="mr-2 size-4" />
                            Cart ({itemCount})
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
                    <section className="space-y-4">
                        <div className="aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
                            {selectedImage ? (
                                <img
                                    src={selectedImage.image_url}
                                    alt={selectedImage.alt ?? product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                                    No image
                                </div>
                            )}
                        </div>

                        {product.images.length > 1 ? (
                            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                                {product.images.map((image, index) => (
                                    <button
                                        key={image.id}
                                        type="button"
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`aspect-square overflow-hidden rounded-lg border transition ${
                                            index === selectedImageIndex
                                                ? 'border-primary ring-2 ring-primary/25'
                                                : 'border-border hover:border-primary/40'
                                        }`}
                                    >
                                        <img
                                            src={image.image_url}
                                            alt={image.alt ?? `${product.name} ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </section>

                    <aside className="h-fit rounded-2xl border bg-card p-6 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            {product.brand ? (
                                <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs">
                                    {product.brand}
                                </span>
                            ) : null}
                            {product.model_name ? (
                                <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs">
                                    {product.model_name}
                                </span>
                            ) : null}
                            {product.product_type ? (
                                <span className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-xs capitalize">
                                    {product.product_type}
                                </span>
                            ) : null}
                        </div>

                        <p className="text-2xl font-bold">{formatMoney(product.price)}</p>

                        {product.compare_at_price !== null &&
                        product.compare_at_price > product.price ? (
                            <p className="mt-1 text-sm text-muted-foreground line-through">
                                {formatMoney(product.compare_at_price)}
                            </p>
                        ) : null}

                        <p className="mt-4 text-sm text-muted-foreground">
                            {product.description ?? 'No description available for this product.'}
                        </p>

                        <div className="mt-5 rounded-lg border bg-muted/30 p-3 text-sm">
                            <p>
                                <span className="font-medium">Stock:</span>{' '}
                                {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                            </p>
                            <p>
                                <span className="font-medium">Gallery:</span>{' '}
                                {product.images.length} image{product.images.length === 1 ? '' : 's'}
                            </p>
                            <p>
                                <span className="font-medium">Color:</span>{' '}
                                {product.color ?? '—'}
                            </p>
                            <p>
                                <span className="font-medium">Material:</span>{' '}
                                {product.material ?? '—'}
                            </p>
                        </div>

                        {requiresClothingSize || requiresShoeSize ? (
                            <div className="mt-4 space-y-3 rounded-lg border bg-background p-3">
                                <p className="text-sm font-medium">
                                    Select options
                                </p>

                                {requiresClothingSize ? (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Clothing size
                                        </label>
                                        <select
                                            value={selectedClothingSize}
                                            onChange={(event) =>
                                                setSelectedClothingSize(event.target.value)
                                            }
                                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                        >
                                            <option value="">Select size</option>
                                            {product.available_clothing_sizes.map((size) => (
                                                <option key={size} value={size}>
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}

                                {requiresShoeSize ? (
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-muted-foreground">
                                            Shoe number
                                        </label>
                                        <select
                                            value={selectedShoeSize}
                                            onChange={(event) =>
                                                setSelectedShoeSize(event.target.value)
                                            }
                                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                        >
                                            <option value="">Select number</option>
                                            {product.available_shoe_sizes.map((size) => (
                                                <option key={size} value={size}>
                                                    {size}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="mt-4 rounded-lg border bg-background p-3 text-sm">
                            <p className="font-medium">Selected options</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                {Object.entries(selectedOptions).length === 0 ? (
                                    <span className="text-muted-foreground">
                                        No configurable option selected yet.
                                    </span>
                                ) : (
                                    Object.entries(selectedOptions).map(([key, value]) => (
                                        <span key={key} className="inline-flex rounded-full border px-2 py-0.5">
                                            {key.replaceAll('_', ' ')}: {value}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg border bg-background p-3 text-sm">
                            <p className="font-medium">Product details</p>
                            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                <span>Brand</span>
                                <span className="text-right text-foreground">{product.brand ?? '—'}</span>
                                <span>Model</span>
                                <span className="text-right text-foreground">{product.model_name ?? '—'}</span>
                                <span>Type</span>
                                <span className="text-right text-foreground">{product.product_type ?? '—'}</span>
                                <span>Clothing sizes</span>
                                <span className="text-right text-foreground">
                                    {product.available_clothing_sizes.join(', ') || '—'}
                                </span>
                                <span>Shoe numbers</span>
                                <span className="text-right text-foreground">
                                    {product.available_shoe_sizes.join(', ') || '—'}
                                </span>
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <label htmlFor="product-quantity" className="text-sm font-medium">
                                Quantity
                            </label>
                            <Input
                                id="product-quantity"
                                type="number"
                                min={1}
                                max={Math.max(1, product.stock)}
                                value={quantityInput}
                                onChange={(event) => handleQuantityChange(event.target.value)}
                                onBlur={() => setQuantityInput(String(resolvedQuantity))}
                                disabled={product.stock <= 0}
                                className="max-w-28"
                            />
                        </div>

                        <Button
                            type="button"
                            onClick={addToCart}
                            disabled={product.stock <= 0 || hasMissingOptions}
                            className="mt-6 h-11 w-full text-base font-semibold"
                        >
                            {product.stock <= 0
                                ? 'Out of stock'
                                : hasMissingOptions
                                  ? 'Select required options'
                                : added
                                  ? 'Added to cart'
                                  : 'Add to cart'}
                        </Button>

                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button asChild variant="outline" className="w-full">
                                <Link href={shopIndex()}>
                                    Alisverise devam et
                                </Link>
                            </Button>
                            <Button asChild className="w-full">
                                <Link href={cartIndex()}>
                                    Sepete git
                                </Link>
                            </Button>
                        </div>
                    </aside>
                </div>
            </div>
        </MarketingLayout>
    );
}
