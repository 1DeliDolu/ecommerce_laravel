<?php

namespace App\Http\Requests\Admin;

use App\Models\Product;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        $product = $this->route('product');

        return $product instanceof Product
            && (bool) $this->user()?->can('update', $product);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'compare_at_price' => ['nullable', 'numeric', 'min:0'],
            'sku' => ['nullable', 'string', 'max:64'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
            'category_ids' => ['required', 'array', 'min:1'],
            'category_ids.*' => ['integer', 'exists:categories,id'],
        ];
    }
}
