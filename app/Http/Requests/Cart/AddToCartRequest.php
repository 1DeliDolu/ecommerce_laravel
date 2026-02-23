<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddToCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('product_id')) {
            $this->merge(['product_id' => (int) $this->input('product_id')]);
        }

        if ($this->has('qty')) {
            $this->merge(['qty' => (int) $this->input('qty')]);
        }
    }

    public function rules(): array
    {
        return [
            'product_id' => [
                'required',
                'integer',
                Rule::exists('products', 'id')->where(fn ($query) => $query->where('is_active', true)),
            ],
            'qty' => ['required', 'integer', 'min:1', 'max:99'],
        ];
    }
}
