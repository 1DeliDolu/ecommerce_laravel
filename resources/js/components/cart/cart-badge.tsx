import { Link } from '@inertiajs/react';

type Props = {
    count?: number;
};

export default function CartBadge({ count = 0 }: Props) {
    return (
        <Link
            href="/cart"
            className="relative inline-flex items-center rounded-sm border border-transparent px-3 py-1.5 text-sm leading-normal text-[#1b1b18] transition hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
            aria-label={`Cart (${count} items)`}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
            </svg>

            {count > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] font-bold text-white dark:bg-white dark:text-gray-900">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    );
}
