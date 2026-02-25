import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';

const CART_STORAGE_KEY = 'ecommerce_cart_items_v1';

export type CartItem = {
    line_id: string;
    id: number;
    slug: string;
    name: string;
    price: number;
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
    image_url?: string | null;
    stock?: number;
};

type AddCartItemInput = Omit<CartItem, 'quantity' | 'line_id'> & {
    quantity?: number;
    line_id?: string;
};

const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;
let storageListenerRegistered = false;

const subscribe = (listener: () => void): (() => void) => {
    listeners.add(listener);

    return () => listeners.delete(listener);
};

const notify = (): void => {
    listeners.forEach((listener) => listener());
};

const normalizeQuantity = (quantity: number): number => {
    if (!Number.isFinite(quantity)) {
        return 1;
    }

    return Math.max(1, Math.floor(quantity));
};

const readStorage = (): CartItem[] => {
    if (typeof window === 'undefined') {
        return [];
    }

    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw) as unknown;

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed
            .map((item) => item as Partial<CartItem>)
            .filter(
                (item) =>
                    typeof item.id === 'number' &&
                    typeof item.slug === 'string' &&
                    typeof item.name === 'string' &&
                    typeof item.price === 'number' &&
                    typeof item.quantity === 'number',
            )
            .map((item) => ({
                line_id: typeof item.line_id === 'string' && item.line_id.trim() !== ''
                    ? item.line_id
                    : `${item.id}:${item.variant_key ?? 'default'}`,
                id: item.id as number,
                slug: item.slug as string,
                name: item.name as string,
                price: item.price as number,
                quantity: normalizeQuantity(item.quantity as number),
                variant_key:
                    typeof item.variant_key === 'string' ? item.variant_key : undefined,
                selected_options:
                    item.selected_options && typeof item.selected_options === 'object'
                        ? item.selected_options
                        : null,
                image_url: item.image_url ?? null,
                stock: typeof item.stock === 'number' ? item.stock : undefined,
            }));
    } catch {
        return [];
    }
};

const writeStorage = (items: CartItem[]): void => {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

const getSnapshot = (): CartItem[] => {
    if (cache === null) {
        cache = readStorage();
    }

    return cache;
};

const getServerSnapshot = (): CartItem[] => [];

const setItems = (nextItems: CartItem[]): void => {
    cache = nextItems;
    writeStorage(nextItems);
    notify();
};

const registerStorageListener = (): void => {
    if (typeof window === 'undefined' || storageListenerRegistered) {
        return;
    }

    window.addEventListener('storage', (event) => {
        if (event.key !== CART_STORAGE_KEY) {
            return;
        }

        cache = readStorage();
        notify();
    });

    storageListenerRegistered = true;
};

export function useCart() {
    const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    useEffect(() => {
        registerStorageListener();
    }, []);

    const addItem = useCallback((payload: AddCartItemInput): void => {
        const quantityToAdd = normalizeQuantity(payload.quantity ?? 1);
        const existingItems = getSnapshot();
        const resolvedLineId = payload.line_id || `${payload.id}:${payload.variant_key ?? 'default'}`;
        const existingIndex = existingItems.findIndex((item) => item.line_id === resolvedLineId);

        if (existingIndex === -1) {
            setItems([
                ...existingItems,
                {
                    line_id: resolvedLineId,
                    id: payload.id,
                    slug: payload.slug,
                    name: payload.name,
                    price: payload.price,
                    quantity: quantityToAdd,
                    variant_key: payload.variant_key,
                    selected_options: payload.selected_options ?? null,
                    image_url: payload.image_url ?? null,
                    stock: payload.stock,
                },
            ]);

            return;
        }

        const updatedItems = existingItems.map((item, index) => {
            if (index !== existingIndex) {
                return item;
            }

            const nextQuantity = item.quantity + quantityToAdd;

            return {
                ...item,
                quantity: item.stock !== undefined
                    ? Math.min(nextQuantity, Math.max(1, item.stock))
                    : nextQuantity,
            };
        });

        setItems(updatedItems);
    }, []);

    const updateItemQuantity = useCallback(
        (lineId: string, quantity: number): void => {
            const normalizedQuantity = Math.max(0, Math.floor(quantity));
            const existingItems = getSnapshot();

            if (normalizedQuantity === 0) {
                setItems(existingItems.filter((item) => item.line_id !== lineId));

                return;
            }

            setItems(
                existingItems.map((item) => {
                    if (item.line_id !== lineId) {
                        return item;
                    }

                    const cappedQuantity =
                        item.stock !== undefined
                            ? Math.min(normalizedQuantity, Math.max(1, item.stock))
                            : normalizedQuantity;

                    return {
                        ...item,
                        quantity: cappedQuantity,
                    };
                }),
            );
        },
        [],
    );

    const removeItem = useCallback((lineId: string): void => {
        setItems(getSnapshot().filter((item) => item.line_id !== lineId));
    }, []);

    const clearCart = useCallback((): void => {
        setItems([]);
    }, []);

    const itemCount = useMemo(() => {
        return items.reduce((total, item) => total + item.quantity, 0);
    }, [items]);

    const subtotal = useMemo(() => {
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [items]);

    return {
        items,
        itemCount,
        subtotal,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
    } as const;
}
