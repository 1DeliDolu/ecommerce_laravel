import { Link, usePage } from '@inertiajs/react';
import CartBadge from '@/components/cart/cart-badge';
import { useCartCount } from '@/hooks/use-cart-count';
import { dashboard, login, register } from '@/routes';

type Props = {
    canRegister?: boolean;
};

export default function MarketingNav({ canRegister = true }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const { count: cartCount } = useCartCount();

    const baseLink =
        'inline-flex items-center rounded-sm px-4 py-1.5 text-sm leading-normal transition';
    const ghostLink = `${baseLink} border border-transparent text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]`;
    const outlineLink = `${baseLink} border border-[#19140035] text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]`;

    return (
        <header className="w-full border-b border-black/5 bg-[#FDFDFC]/80 backdrop-blur dark:border-white/10 dark:bg-[#0a0a0a]/60">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <span className="text-sm font-semibold tracking-tight text-[#1b1b18] dark:text-[#EDEDEC]">
                        Ecommerce
                    </span>
                </Link>

                <nav className="flex items-center gap-2 sm:gap-3">
                    <CartBadge count={cartCount} />
                    <Link href="/products" className={ghostLink}>
                        Products
                    </Link>
                    {auth.user ? (
                        <>
                            <Link href={dashboard()} className={outlineLink}>
                                Dashboard
                            </Link>

                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className={ghostLink}
                            >
                                Logout
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href={login()} className={ghostLink}>
                                Log in
                            </Link>

                            {canRegister && (
                                <Link href={register()} className={outlineLink}>
                                    Register
                                </Link>
                            )}
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}
