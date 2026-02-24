<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class PaymentMethodRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if ($this->cardholder_name) {
            $this->merge(['cardholder_name' => \Illuminate\Support\Str::squish($this->cardholder_name)]);
        }
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'brand' => ['required', 'string', 'in:visa,mastercard,amex,discover'],
            'last4' => ['required', 'string', 'digits:4'],
            'cardholder_name' => ['required', 'string', 'max:100'],
            'exp_month' => ['required', 'integer', 'between:1,12'],
            'exp_year' => ['required', 'integer', 'min:'.now()->year],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'last4.digits' => 'The card number must be exactly 4 digits.',
            'exp_year.min' => 'The expiry year must not be in the past.',
        ];
    }
}
