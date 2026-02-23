import { Head, Link } from '@inertiajs/react';
import AddToCartForm from '@/components/cart/add-to-cart-form';

import ProductImage from '@/components/shop/ProductImage';
import MarketingLayout from '@/layouts/marketing-layout';

type Category = {
    id: number;
    name: string;
    slug: string;
};

type ProductImageItem = {
    id: number;
    url: string;
    alt: string | null;
    is_primary: boolean;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string;
    compare_at_price: string | null;
    images: ProductImageItem[];
    categories: Category[];
};

type Props = {
    product: Product;
};

export default function ShopProductShow({ product }: Props) {
    const primary =
        product.images.find((i) => i.is_primary) ?? product.images[0] ?? null;

    return (
        <MarketingLayout title={product.name}>
            <Head title={product.name} />

            <div className="mx-auto max-w-6xl px-4 py-10">
                <div className="mb-6">
                    <Link
                        href="/products"
                        className="text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                    >
                        ← Back to products
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Images */}
                    <div className="space-y-4">
                        <ProductImage
                            src={primary?.url ?? null}
                            alt={product.name}
                            className="h-[420px] w-full rounded-2xl object-cover"
                            fallbackText="No image"
                        />

                        {product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {product.images.map((img) => (
                                    <div
                                        key={img.id}
                                        className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
                                    >
                                        <ProductImage
                                            src={img.url}
                                            alt={img.alt ?? product.name}
                                            className="h-20 w-full object-cover"
                                            fallbackText="—"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Details */}
                    <div className="space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                            {product.name}
                        </h1>

                        <div className="flex items-baseline gap-3">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {product.price}
                            </div>
                            {product.compare_at_price && (
                                <div className="text-base text-gray-400 line-through">
                                    {product.compare_at_price}
                                </div>
                            )}
                        </div>

                        {product.description && (
                            <p className="leading-relaxed text-gray-700 dark:text-gray-300">
                                {product.description}
                            </p>
                        )}

                        {product.categories.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {product.categories.map((c) => (
                                    <span
                                        key={c.id}
                                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                    >
                                        {c.name}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="pt-6">
                            <AddToCartForm productId={product.id} />

                            <div className="mt-2">
                                <Link
                                    href="/cart"
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    View cart
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}
