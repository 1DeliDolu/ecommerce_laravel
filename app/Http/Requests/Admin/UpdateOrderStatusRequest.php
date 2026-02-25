<?php

namespace App\Http\Requests\Admin;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('access-admin') ?? false;
    }

    public function rules(): array
    {
        $order = $this->route('order');

        return [
            'status' => [
                'required',
                'string',
                Rule::in(Order::statuses()),
                function (string $attribute, mixed $value, \Closure $fail) use ($order): void {
                    if (! $order instanceof Order) {
                        return;
                    }

                    if (! is_string($value) || ! $order->canTransitionTo($value)) {
                        $fail('The selected status transition is not allowed.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Please choose an order status.',
            'status.in' => 'The selected order status is invalid.',
        ];
    }
}
