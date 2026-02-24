import { usePage } from '@inertiajs/react';

export type UseCartCountReturn = {
    readonly count: number;
    readonly isEmpty: boolean;
    readonly hasItems: boolean;
};

/**
 * Hook to get current cart item count
 * Automatically updates when cart items change via Inertia page props
 * Used in header/nav components to display real-time cart badge count
 *
 * @returns Cart count object with helper flags
 *
 * @example
 * const { count, hasItems } = useCartCount();
 * return (
 *   <CartBadge count={count}>
 *     {hasItems ? 'Cart' : 'Empty'}
 *   </CartBadge>
 * );
 */
export function useCartCount(): UseCartCountReturn {
    const page = usePage();

    // Get cart item count from Inertia page props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = (page.props as any)?.cart?.items_count ?? 0;

    const isEmpty = count === 0;
    const hasItems = count > 0;

    return {
        count,
        isEmpty,
        hasItems,
    } as const;
}
