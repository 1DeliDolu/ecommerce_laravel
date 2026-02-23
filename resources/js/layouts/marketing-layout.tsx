import { Head } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import MarketingNav from '@/components/marketing-nav';

type Props = PropsWithChildren<{
    title?: string;
    canRegister?: boolean;
}>;

export default function MarketingLayout({
    title = 'Welcome',
    canRegister = true,
    children,
}: Props) {
    return (
        <>
            <Head title={title}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>

            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <MarketingNav canRegister={canRegister} />

                <main className="flex flex-1 flex-col">{children}</main>
            </div>
        </>
    );
}
