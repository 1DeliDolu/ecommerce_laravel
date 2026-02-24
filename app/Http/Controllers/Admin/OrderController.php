<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\OrderStatusUpdated;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    /** Allowed status transitions: from → [to, ...] */
    private const TRANSITIONS = [
        'pending' => ['paid', 'cancelled'],
        'paid' => ['shipped', 'cancelled'],
        'shipped' => [],
        'cancelled' => [],
    ];

    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $status = $request->query('status', 'all');

        $orders = Order::query()
            ->withCount('items')
            ->when($q !== '', fn ($query) => $query->where(function ($sub) use ($q) {
                $sub->where('public_id', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%")
                    ->orWhere('first_name', 'like', "%{$q}%")
                    ->orWhere('last_name', 'like', "%{$q}%");
            }))
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => ['q' => $q, 'status' => $status],
            'statuses' => array_keys(self::TRANSITIONS),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->loadMissing(['items', 'user:id,name,email']);

        return Inertia::render('admin/orders/show', [
            'order' => [
                'id' => $order->id,
                'public_id' => $order->public_id,
                'status' => $order->status,
                'created_at' => $order->created_at?->toISOString(),

                'first_name' => $order->first_name,
                'last_name' => $order->last_name,
                'email' => $order->email,
                'phone' => $order->phone,

                'address1' => $order->address1,
                'address2' => $order->address2,
                'city' => $order->city,
                'postal_code' => $order->postal_code,
                'country' => $order->country,

                'currency' => $order->currency,
                'subtotal' => number_format($order->subtotal_cents / 100, 2),
                'tax' => number_format($order->tax_cents / 100, 2),
                'shipping' => number_format($order->shipping_cents / 100, 2),
                'total' => number_format($order->total_cents / 100, 2),

                'user' => $order->user ? [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                ] : null,

                'items' => $order->items->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->product_name,
                    'slug' => $item->product_slug,
                    'qty' => $item->quantity,
                    'unit_price' => number_format($item->unit_price_cents / 100, 2),
                    'line_total' => number_format($item->line_total_cents / 100, 2),
                ])->values()->all(),
            ],
            'allowed_transitions' => self::TRANSITIONS[$order->status] ?? [],
        ]);
    }

    public function updateStatus(Request $request, Order $order): RedirectResponse
    {
        $allowedTransitions = self::TRANSITIONS[$order->status] ?? [];

        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in($allowedTransitions)],
        ]);

        $previousStatus = $order->status;
        $order->update(['status' => $validated['status']]);

        Mail::to($order->email)->send(new OrderStatusUpdated($order, $previousStatus));

        return redirect()
            ->route('admin.orders.show', $order)
            ->with('success', "Order status updated to {$validated['status']}.");
    }
}
