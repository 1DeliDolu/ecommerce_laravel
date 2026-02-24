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
        $digits = preg_replace('/\D/', '', $this->card_number ?? '');

        $detectedBrand = $this->detectBrand($digits);

        $this->merge([
            'card_number' => $digits,
            'brand' => $detectedBrand ?: ($this->brand ?? ''),
            'last4' => strlen($digits) >= 4 ? substr($digits, -4) : '',
            'cardholder_name' => \Illuminate\Support\Str::squish($this->cardholder_name ?? ''),
        ]);
    }

    private function detectBrand(string $number): string
    {
        if (preg_match('/^4/', $number)) {
            return 'visa';
        }

        if (preg_match('/^(5[1-5]|2[2-7]\d{2})/', $number)) {
            return 'mastercard';
        }

        if (preg_match('/^3[47]/', $number)) {
            return 'amex';
        }

        if (preg_match('/^(6011|65|64[4-9]|622)/', $number)) {
            return 'discover';
        }

        if (preg_match('/^9792/', $number)) {
            return 'troy';
        }

        return '';
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'card_number' => ['required', 'digits_between:15,16'],
            'brand' => ['required', 'string', 'in:visa,mastercard,amex,discover,troy'],
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
            'card_number.required' => 'Please enter a card number.',
            'card_number.digits_between' => 'The card number must be 15 or 16 digits.',
            'brand.required' => 'Could not detect a supported card brand (Visa, Mastercard, Amex, Discover).',
            'brand.in' => 'Only Visa, Mastercard, Amex, and Discover are supported.',
            'exp_year.min' => 'The expiry year must not be in the past.',
        ];
    }
}
