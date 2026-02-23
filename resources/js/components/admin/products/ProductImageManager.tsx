import { router, useForm } from '@inertiajs/react';
import React, { useMemo } from 'react';

type ProductImage = {
    id: number;
    path: string;
    url: string;
    is_primary: boolean;
};

type Props = {
    productId: number;
    images: ProductImage[];
    trashedImages: ProductImage[];
};

export default function ProductImageManager({
    productId,
    images,
    trashedImages,
}: Props) {
    const sortedImages = useMemo(() => {
        return [...images].sort((a, b) => {
            const primaryDiff = Number(b.is_primary) - Number(a.is_primary);
            if (primaryDiff !== 0) return primaryDiff;
            return a.id - b.id;
        });
    }, [images]);

    const uploadForm = useForm<{ images: File[] }>({
        images: [],
    });

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        uploadForm.setData('images', files);
    };

    const submitUpload = (e: React.FormEvent) => {
        e.preventDefault();

        if (uploadForm.data.images.length === 0) return;

        uploadForm.post(`/admin/products/${productId}/images`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => uploadForm.reset('images'),
        });
    };

    const setPrimary = (imageId: number) => {
        router.patch(
            `/admin/product-images/${imageId}`,
            { is_primary: true },
            { preserveScroll: true },
        );
    };

    const removeImage = (imageId: number) => {
        if (
            !confirm(
                'Remove this image? The file will be kept and can be recovered.',
            )
        )
            return;

        router.delete(`/admin/product-images/${imageId}`, {
            preserveScroll: true,
        });
    };

    const forceDeleteImage = (imageId: number) => {
        if (
            !confirm(
                'Permanently delete this image? The file will be removed from storage and cannot be recovered.',
            )
        )
            return;

        router.delete(`/admin/product-images/${imageId}/force`, {
            preserveScroll: true,
        });
    };

    const restoreImage = (imageId: number) => {
        router.patch(
            `/admin/product-images/${imageId}/restore`,
            {},
            { preserveScroll: true },
        );
    };

    return (
        <div className="space-y-6">
            {/* Upload form */}
            <form
                onSubmit={submitUpload}
                className="rounded-2xl border border-gray-200 p-4"
            >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                            Upload images
                        </div>
                        <div className="text-xs text-gray-600">
                            JPG / PNG / WebP, up to 5MB each. If no primary
                            exists, the first uploaded image becomes primary.
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={onFileChange}
                            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-800"
                        />
                        <button
                            type="submit"
                            disabled={
                                uploadForm.processing ||
                                uploadForm.data.images.length === 0
                            }
                            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {uploadForm.processing ? 'Uploading…' : 'Upload'}
                        </button>
                    </div>
                </div>

                {uploadForm.errors.images && (
                    <div className="mt-3 text-sm text-red-600">
                        {uploadForm.errors.images}
                    </div>
                )}
            </form>

            {/* Active images */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {sortedImages.map((img) => (
                    <div
                        key={img.id}
                        className="rounded-2xl border border-gray-200 p-3"
                    >
                        <div className="relative overflow-hidden rounded-xl border border-gray-100">
                            <img
                                src={img.url}
                                alt=""
                                className="h-40 w-full object-cover"
                            />
                            {img.is_primary && (
                                <div className="absolute top-2 left-2 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white">
                                    Primary
                                </div>
                            )}
                        </div>

                        <div className="mt-3 flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => setPrimary(img.id)}
                                disabled={img.is_primary}
                                className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                Set as primary
                            </button>

                            <button
                                type="button"
                                onClick={() => removeImage(img.id)}
                                className="rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700"
                            >
                                Remove
                            </button>

                            <button
                                type="button"
                                onClick={() => forceDeleteImage(img.id)}
                                className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                            >
                                Delete forever
                            </button>
                        </div>
                    </div>
                ))}

                {sortedImages.length === 0 && (
                    <div className="col-span-2 rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-600 md:col-span-4">
                        No images yet. Upload your first product images above.
                    </div>
                )}
            </div>

            {/* Trashed images */}
            {trashedImages.length > 0 && (
                <div>
                    <div className="mb-3 text-sm font-medium text-gray-500">
                        Trashed images ({trashedImages.length})
                    </div>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {trashedImages.map((img) => (
                            <div
                                key={img.id}
                                className="rounded-2xl border border-dashed border-red-200 p-3 opacity-70"
                            >
                                <div className="relative overflow-hidden rounded-xl border border-gray-100">
                                    <img
                                        src={img.url}
                                        alt=""
                                        className="h-40 w-full object-cover grayscale"
                                    />
                                    <div className="absolute top-2 left-2 rounded-lg bg-red-600/80 px-2 py-1 text-xs font-semibold text-white">
                                        Trashed
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-col gap-2">
                                    <button
                                        type="button"
                                        onClick={() => restoreImage(img.id)}
                                        className="rounded-xl border border-green-200 px-3 py-2 text-sm font-semibold text-green-700"
                                    >
                                        Restore
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => forceDeleteImage(img.id)}
                                        className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                                    >
                                        Delete forever
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
