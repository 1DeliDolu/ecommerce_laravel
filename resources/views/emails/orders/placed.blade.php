<!DOCTYPE html>
<html lang="en">
<body>
    <h1>Order Confirmed</h1>
    <p>Hi,</p>
    <p>Your order <strong>{{ $order->public_id }}</strong> has been placed successfully.</p>
    <p>Status: <strong>{{ strtoupper($order->status) }}</strong></p>
    <p>Total: <strong>{{ number_format((float) $order->total, 2) }}</strong></p>
    <p>Thank you for shopping with us.</p>
</body>
</html>
