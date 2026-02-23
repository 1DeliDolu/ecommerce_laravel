import { Head, Link } from '@inertiajs/react';

import ProductImage from '@/components/shop/ProductImage';
import MarketingLayout from '@/layouts/marketing-layout';

type Category = {
    id: number;
    name: string;
    slug: string;
};

type PrimaryImage = {
    id: number;
    url: string;
    alt: string | null;
    is_primary: boolean;
};

type Product = {
    id: number;
    name: string;
    slug: string;
    price: string;
    primary_image: PrimaryImage | null;
    categories: Category[];
};

type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

type Paginator<T> = {
    data: T[];
    links: PaginationLink[];
};

type Props = {
    products: Paginator<Product>;
    filters: { q: string; category: string };
};

function stripLabel(label: string) {
    return label
        .replace('&laquo;', '«')
        .replace('&raquo;', '»')
        .replace(/<[^>]*>/g, '')
        .trim();
}

export default function ShopProductIndex({ products, filters }: Props) {
    return (
        <MarketingLayout title="Shop">
            <Head title="Shop" />

            <div className="mx-auto max-w-7xl px-4 py-10">
                <div className="flex items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                            Products
                        </h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            Browse our catalog.
                        </p>
                    </div>
                </div>

                <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {products.data.map((p) => (
                        <Link
                            key={p.id}
                            href={`/products/${p.slug}`}
                            className="group rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                        >
                            <ProductImage
                                src={p.primary_image?.url ?? null}
                                alt={p.name}
                                className="h-44 w-full rounded-xl object-cover"
                                fallbackText="No image"
                            />

                            <div className="mt-4 space-y-1">
                                <div className="text-sm font-semibold text-gray-900 group-hover:underline dark:text-white">
                                    {p.name}
                                </div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white">
                                    {p.price}
                                </div>
                            </div>
                        </Link>
                    ))}

                    {products.data.length === 0 && (
                        <div className="col-span-full rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-600 dark:border-gray-700 dark:text-gray-400">
                            {filters.q
                                ? 'No products match your search.'
                                : 'No products available yet.'}
                        </div>
                    )}
                </div>

                {products.links.length > 3 && (
                    <div className="mt-8 flex flex-wrap justify-center gap-1">
                        {products.links.map((link, i) => {
                            const label = stripLabel(link.label);
                            if (!link.url) {
                                return (
                                    <span
                                        key={i}
                                        className="rounded-md px-3 py-1 text-sm text-gray-400"
                                        dangerouslySetInnerHTML={{ __html: label }}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={i}
                                    href={link.url}
                                    className={`rounded-md px-3 py-1 text-sm font-medium transition ${
                                        link.active
                                            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                            : 'border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: label }} />
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </MarketingLayout>
    );
}
