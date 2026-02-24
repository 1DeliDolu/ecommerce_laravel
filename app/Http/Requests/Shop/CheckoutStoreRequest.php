<?php

namespace App\Http\Requests\Shop;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class CheckoutStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Guest checkout’a da açık (istersen ileride auth zorunlu yaparız).
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => is_string($this->first_name) ? Str::squish($this->first_name) : $this->first_name,
            'last_name' => is_string($this->last_name) ? Str::squish($this->last_name) : $this->last_name,
            'email' => is_string($this->email) ? Str::lower(Str::squish($this->email)) : $this->email,
            'phone' => is_string($this->phone) ? Str::squish($this->phone) : $this->phone,
            'address1' => is_string($this->address1) ? Str::squish($this->address1) : $this->address1,
            'address2' => is_string($this->address2) ? Str::squish($this->address2) : $this->address2,
            'city' => is_string($this->city) ? Str::squish($this->city) : $this->city,
            'postal_code' => is_string($this->postal_code) ? Str::squish($this->postal_code) : $this->postal_code,
            'country' => is_string($this->country) ? Str::squish($this->country) : $this->country,
        ]);
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:80'],
            'last_name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],

            'address1' => ['required', 'string', 'max:255'],
            'address2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'postal_code' => ['required', 'string', 'max:20'],
            'country' => ['required', 'string', 'max:120'],
        ];
    }

    public function attributes(): array
    {
        return [
            'first_name' => 'first name',
            'last_name' => 'last name',
            'postal_code' => 'postal code',
        ];
    }
}
