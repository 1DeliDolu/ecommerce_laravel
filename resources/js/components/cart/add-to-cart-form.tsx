import { useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';

type Props = {
    productId: number;
    initialQty?: number;
    disabled?: boolean;
};

export default function AddToCartForm({
    productId,
    initialQty = 1,
    disabled = false,
}: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        product_id: number;
        qty: number;
    }>({
        product_id: productId,
        qty: initialQty,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();

        post('/cart', {
            preserveScroll: true,
        });
    };

    return (
        <form
            onSubmit={submit}
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3"
        >
            <div className="flex flex-col gap-1">
                <label
                    htmlFor={`qty-${productId}`}
                    className="text-xs text-gray-600"
                >
                    Qty
                </label>

                <input
                    id={`qty-${productId}`}
                    type="number"
                    min={1}
                    max={99}
                    value={data.qty}
                    onChange={(e) => setData('qty', Number(e.target.value))}
                    disabled={disabled || processing}
                    className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                />

                {errors.qty && (
                    <p className="text-xs text-red-600">{errors.qty}</p>
                )}
                {errors.product_id && (
                    <p className="text-xs text-red-600">{errors.product_id}</p>
                )}
            </div>

            <button
                type="submit"
                disabled={disabled || processing}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
                {processing ? 'Adding...' : 'Add to cart'}
            </button>
        </form>
    );
}
