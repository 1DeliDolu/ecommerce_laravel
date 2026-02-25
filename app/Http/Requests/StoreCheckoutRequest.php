<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCheckoutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $paymentMethodRules = ['nullable', 'prohibited'];

        if ($this->user() !== null) {
            $paymentMethodRule = Rule::exists('payment_methods', 'id')->where(
                fn ($query) => $query->where('user_id', $this->user()->id),
            );

            $paymentMethodRules = ['nullable', 'integer', $paymentMethodRule];
        }

        $maxYear = now()->year + 25;

        return [
            'full_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'postal_code' => ['required', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:120'],
            'accepted' => ['accepted'],
            'payment_method_id' => $paymentMethodRules,
            'card_holder_name' => ['nullable', 'required_without:payment_method_id', 'string', 'max:120'],
            'card_number' => ['nullable', 'required_without:payment_method_id', 'digits:16'],
            'cvc' => ['nullable', 'required_without:payment_method_id', 'digits_between:3,4'],
            'expiry_month' => ['nullable', 'required_without:payment_method_id', 'integer', 'between:1,12'],
            'expiry_year' => ['nullable', 'required_without:payment_method_id', 'integer', 'min:'.now()->year, 'max:'.$maxYear],
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.variant_key' => ['nullable', 'string', 'max:120'],
            'items.*.selected_options' => ['nullable', 'array'],
            'items.*.selected_options.brand' => ['nullable', 'string', 'max:120'],
            'items.*.selected_options.model' => ['nullable', 'string', 'max:120'],
            'items.*.selected_options.product_type' => ['nullable', 'string', 'max:40'],
            'items.*.selected_options.clothing_size' => ['nullable', 'string', 'max:20'],
            'items.*.selected_options.shoe_size' => ['nullable', 'string', 'max:20'],
            'items.*.selected_options.color' => ['nullable', 'string', 'max:80'],
            'items.*.selected_options.material' => ['nullable', 'string', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'full_name.required' => 'Please enter your full name.',
            'email.required' => 'Please enter your email address.',
            'address.required' => 'Please enter your delivery address.',
            'city.required' => 'Please enter your city.',
            'postal_code.required' => 'Please enter your postal code.',
            'country.required' => 'Please enter your country.',
            'accepted.accepted' => 'You must confirm checkout before continuing.',
            'card_holder_name.required_without' => 'Please enter the card holder name.',
            'card_number.required_without' => 'Please enter the card number.',
            'card_number.digits' => 'Card number must be exactly 16 digits.',
            'cvc.required_without' => 'Please enter the CVC.',
            'cvc.digits_between' => 'CVC must be 3 or 4 digits.',
            'expiry_month.required_without' => 'Please enter the expiry month.',
            'expiry_month.between' => 'Expiry month must be between 1 and 12.',
            'expiry_year.required_without' => 'Please enter the expiry year.',
            'expiry_year.min' => 'Expiry year is invalid.',
            'items.required' => 'Please add at least one item to checkout.',
            'items.min' => 'Please add at least one item to checkout.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $items = collect($this->input('items', []))
            ->filter(fn (mixed $item): bool => is_array($item))
            ->map(fn (array $item): array => [
                'id' => isset($item['id']) ? (int) $item['id'] : null,
                'quantity' => isset($item['quantity']) ? (int) $item['quantity'] : null,
                'variant_key' => isset($item['variant_key']) ? trim((string) $item['variant_key']) : null,
                'selected_options' => $this->sanitizeSelectedOptions($item['selected_options'] ?? null),
            ])
            ->values()
            ->all();

        $cardHolderName = trim((string) $this->input('card_holder_name', ''));
        $cardNumber = $this->sanitizeDigits((string) $this->input('card_number', ''));
        $cvc = $this->sanitizeDigits((string) $this->input('cvc', ''));

        $this->merge([
            'full_name' => trim((string) $this->input('full_name', '')),
            'email' => trim((string) $this->input('email', '')),
            'phone' => trim((string) $this->input('phone', '')),
            'address' => trim((string) $this->input('address', '')),
            'city' => trim((string) $this->input('city', '')),
            'postal_code' => trim((string) $this->input('postal_code', '')),
            'country' => trim((string) $this->input('country', '')),
            'accepted' => $this->boolean('accepted'),
            'payment_method_id' => $this->filled('payment_method_id')
                ? (int) $this->input('payment_method_id')
                : null,
            'card_holder_name' => $cardHolderName !== '' ? $cardHolderName : null,
            'card_number' => $cardNumber !== '' ? $cardNumber : null,
            'cvc' => $cvc !== '' ? $cvc : null,
            'expiry_month' => $this->filled('expiry_month') ? (int) $this->input('expiry_month') : null,
            'expiry_year' => $this->filled('expiry_year') ? (int) $this->input('expiry_year') : null,
            'items' => $items,
        ]);
    }

    private function sanitizeDigits(string $value): string
    {
        return preg_replace('/\D+/', '', $value) ?? '';
    }

    /**
     * @return array<string, string>|null
     */
    private function sanitizeSelectedOptions(mixed $value): ?array
    {
        if (! is_array($value)) {
            return null;
        }

        $allowedKeys = [
            'brand',
            'model',
            'product_type',
            'clothing_size',
            'shoe_size',
            'color',
            'material',
        ];

        $normalized = collect($value)
            ->only($allowedKeys)
            ->filter(fn (mixed $item): bool => is_scalar($item))
            ->map(fn (mixed $item): string => trim((string) $item))
            ->filter(fn (string $item): bool => $item !== '')
            ->all();

        return ! empty($normalized) ? $normalized : null;
    }
}
