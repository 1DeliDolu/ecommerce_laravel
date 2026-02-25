import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Boxes,
    CreditCard,
    ShieldCheck,
    Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketingLayout from '@/layouts/marketing-layout';
import { dashboard, login, register } from '@/routes';
import { index as shopIndex } from '@/routes/shop';

type PageProps = {
    auth?: {
        user?: {
            name?: string;
        } | null;
    };
};

type FeatureCard = {
    title: string;
    description: string;
    icon: typeof Boxes;
};

const featureCards: FeatureCard[] = [
    {
        title: 'Catalog-ready structure',
        description:
            'Products, categories, images and rich filters are already wired for fast iteration.',
        icon: Boxes,
    },
    {
        title: 'Checkout foundations',
        description:
            'Cart, shipping input, payment method support and order flow are built in.',
        icon: CreditCard,
    },
    {
        title: 'Admin visibility',
        description:
            'Track sales metrics, manage products and monitor order lifecycle in one place.',
        icon: BarChart3,
    },
];

const launchChecklist = [
    'Define category tree and product variants',
    'Upload product photos and polish descriptions',
    'Configure shipping, payment and tax defaults',
    'Review admin analytics and order statuses',
];

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<PageProps>().props;
    const isAuthenticated = auth?.user !== null && auth?.user !== undefined;

    return (
        <MarketingLayout title="Welcome" canRegister={canRegister}>
            <section className="relative overflow-hidden border-b border-black/5 bg-gradient-to-b from-[#f6f8ff] via-[#fbfcff] to-[#fdfdfc] dark:border-white/10 dark:from-[#0f1220] dark:via-[#0c0f18] dark:to-[#0a0a0a]">
                <div className="pointer-events-none absolute inset-0">
                    <div className="absolute -left-24 top-12 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
                    <div className="absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
                </div>

                <div className="relative mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-medium tracking-wide text-sky-900 shadow-sm backdrop-blur dark:border-sky-400/30 dark:bg-white/5 dark:text-sky-100">
                            <ShieldCheck className="size-3.5" />
                            Laravel + Inertia Ecommerce Starter
                        </div>

                        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#131315] sm:text-5xl dark:text-white">
                            Launch a polished store without rebuilding the basics.
                        </h1>

                        <p className="mt-4 max-w-2xl text-base leading-7 text-black/70 dark:text-white/70">
                            This project gives you a production-oriented baseline with
                            storefront flows, checkout, customer account pages and an
                            admin layer.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center gap-3">
                            <Button asChild size="lg">
                                <Link href={shopIndex()}>
                                    Explore shop
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>

                            {isAuthenticated ? (
                                <Button asChild variant="outline" size="lg">
                                    <Link href={dashboard()}>Go to dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Button asChild variant="outline" size="lg">
                                        <Link href={login()}>Log in</Link>
                                    </Button>

                                    {canRegister && (
                                        <Button asChild variant="secondary" size="lg">
                                            <Link href={register()}>Create account</Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid gap-4 md:grid-cols-3">
                    {featureCards.map((feature) => {
                        const Icon = feature.icon;

                        return (
                            <article
                                key={feature.title}
                                className="rounded-2xl border border-black/10 bg-white/70 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5"
                            >
                                <div className="mb-4 inline-flex rounded-lg bg-slate-900 p-2 text-white dark:bg-white dark:text-slate-900">
                                    <Icon className="size-4" />
                                </div>
                                <h2 className="text-base font-semibold text-[#151518] dark:text-white">
                                    {feature.title}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-black/70 dark:text-white/70">
                                    {feature.description}
                                </p>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="mx-auto mb-16 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-6 rounded-3xl border border-black/10 bg-gradient-to-br from-white to-slate-50 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr] dark:border-white/10 dark:from-white/5 dark:to-white/[0.03]">
                    <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            Recommended launch order
                        </p>
                        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#151518] dark:text-white">
                            Ship confidently in four focused steps.
                        </h2>
                        <p className="mt-3 text-sm leading-6 text-black/70 dark:text-white/70">
                            Keep scope tight in the first release, then expand catalog depth,
                            promotions and analytics with real user feedback.
                        </p>
                    </div>

                    <ul className="space-y-3">
                        {launchChecklist.map((item) => (
                            <li
                                key={item}
                                className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                            >
                                <Truck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        </MarketingLayout>
    );
}
