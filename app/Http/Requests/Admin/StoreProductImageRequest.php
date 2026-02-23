<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Foundation\Http\FormRequest;

class StoreProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product
            && (bool) $this->user()?->can('create', [ProductImage::class, $product]);
    }

    public function rules(): array
    {
        return [
            'images' => ['required', 'array', 'min:1', 'max:10'],
            'images.*' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120', // 5MB each
            ],
        ];
    }
}