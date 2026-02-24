@php
    $currency = $order->currency ?? 'EUR';

    $money = function (int $cents) use ($currency) {
        $amount = number_format($cents / 100, 2);
        return "{$currency} {$amount}";
    };
@endphp

@component('mail::message')
# Order confirmed

Thanks for your order!

**Reference:** {{ $order->public_id }}  
**Status:** {{ $order->status }}  
**Email:** {{ $order->email }}

@component('mail::table')
| Item | Qty | Unit | Line |
|:---|---:|---:|---:|
@foreach ($order->items as $item)
| {{ $item->product_name }} | {{ (int) $item->quantity }} | {{ $money((int) $item->unit_price_cents) }} | {{ $money((int) $item->line_total_cents) }} |
@endforeach
@endcomponent

**Subtotal:** {{ $money((int) $order->subtotal_cents) }}  
**Shipping:** {{ $money((int) $order->shipping_cents) }}  
**Tax:** {{ $money((int) $order->tax_cents) }}  
**Total:** **{{ $money((int) $order->total_cents) }}**

@component('mail::button', ['url' => route('shop.checkout.success', ['publicId' => $order->public_id])])
View order details
@endcomponent

Thanks,  
{{ config('app.name') }}
@endcomponent