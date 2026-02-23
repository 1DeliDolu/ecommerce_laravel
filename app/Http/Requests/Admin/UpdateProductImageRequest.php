<?php

namespace App\Http\Requests\Admin;

use App\Models\ProductImage;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $productImage = $this->route('productImage');

        return $productImage instanceof ProductImage
            && (bool) $this->user()?->can('update', $productImage);
    }

    public function rules(): array
    {
        return [
            // Used for "Set as primary" action.
            'is_primary' => ['sometimes', 'boolean'],
        ];
    }
}