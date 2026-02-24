<p>Hello{{ $order->customer_name ? ' '.$order->customer_name : '' }},</p>

<p>Your order <strong>{{ $order->public_id }}</strong> status has been updated.</p>

<p>
    Previous status: <strong>{{ $previousStatus }}</strong><br>
    Current status: <strong>{{ $currentStatus }}</strong>
</p>

<p>Thank you for shopping with us.</p>
