<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'is_primary' => ['sometimes', 'boolean'],
            'alt' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
