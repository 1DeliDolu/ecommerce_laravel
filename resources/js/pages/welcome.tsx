import MarketingLayout from '@/layouts/marketing-layout';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    return (
        <MarketingLayout title="Welcome" canRegister={canRegister}>
            <div className="flex w-full flex-1 items-center justify-center opacity-100 transition-opacity duration-750 lg:grow starting:opacity-0">
                <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Modern ecommerce starter
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-black/70 dark:text-white/70">
                            Next step: categories, products, images, coupons,
                            orders, addresses, and a clean admin dashboard.
                        </p>
                    </div>
                </div>
            </div>

            <div className="hidden h-14.5 lg:block"></div>
        </MarketingLayout>
    );
}
