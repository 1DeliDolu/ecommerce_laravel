@component('mail::message')
# Order Status Updated

Hi {{ $order->first_name }},

Your order **{{ $order->public_id }}** status has been updated.

| | |
|:---|:---|
| **Previous status** | {{ ucfirst($previousStatus) }} |
| **New status** | {{ ucfirst($order->status) }} |

@if ($order->status === 'shipped')
Your order is on its way! You will receive it soon.
@elseif ($order->status === 'cancelled')
Your order has been cancelled. If you have any questions, please contact us.
@elseif ($order->status === 'paid')
Your payment has been confirmed. We are preparing your order.
@endif

If you have any questions about your order, feel free to reply to this email.

Thanks,
{{ config('app.name') }}
@endcomponent
