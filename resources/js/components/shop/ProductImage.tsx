import { useMemo, useState } from 'react';

type Props = {
    src?: string | null;
    alt?: string;
    className?: string;
    fallbackText?: string;
};

/**
 * A resilient <img> wrapper for shop UI:
 * - Handles missing src
 * - Handles broken image URLs (onError)
 */
export default function ProductImage({
    src,
    alt = '',
    className = '',
    fallbackText = 'No image',
}: Props) {
    const [broken, setBroken] = useState(false);

    const showFallback = useMemo(() => {
        return !src || src.trim() === '' || broken;
    }, [src, broken]);

    if (showFallback) {
        return (
            <div
                className={[
                    'flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 text-xs font-semibold text-gray-600',
                    className,
                ].join(' ')}
            >
                {fallbackText}
            </div>
        );
    }

    return (
        <img
            src={src as string}
            alt={alt}
            className={className}
            onError={() => setBroken(true)}
            loading="lazy"
        />
    );
}
