<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePaymentMethodRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxYear = now()->year + 25;

        return [
            'label' => ['nullable', 'string', 'max:80'],
            'card_holder_name' => ['required', 'string', 'max:120'],
            'card_number' => ['required', 'digits:16'],
            'cvc' => ['required', 'digits_between:3,4'],
            'expiry_month' => ['required', 'integer', 'between:1,12'],
            'expiry_year' => ['required', 'integer', 'min:'.now()->year, 'max:'.$maxYear],
            'is_default' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'card_holder_name.required' => 'Please enter the card holder name.',
            'card_number.required' => 'Please enter the card number.',
            'card_number.digits' => 'Card number must be exactly 16 digits.',
            'cvc.required' => 'Please enter the CVC.',
            'cvc.digits_between' => 'CVC must be 3 or 4 digits.',
            'expiry_month.required' => 'Please enter the expiry month.',
            'expiry_month.between' => 'Expiry month must be between 1 and 12.',
            'expiry_year.required' => 'Please enter the expiry year.',
            'expiry_year.min' => 'Expiry year is invalid.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'card_number' => $this->sanitizeDigits((string) $this->input('card_number', '')),
            'cvc' => $this->sanitizeDigits((string) $this->input('cvc', '')),
            'expiry_month' => $this->filled('expiry_month') ? (int) $this->input('expiry_month') : null,
            'expiry_year' => $this->filled('expiry_year') ? (int) $this->input('expiry_year') : null,
            'is_default' => $this->boolean('is_default'),
        ]);
    }

    private function sanitizeDigits(string $value): string
    {
        return preg_replace('/\D+/', '', $value) ?? '';
    }
}
