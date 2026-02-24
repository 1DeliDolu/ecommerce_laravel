<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $orders = $user->orders()
            ->withCount('items')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString()
            ->through(function (Order $order): array {
                $placedAt = $order->placed_at ?? $order->created_at;

                return [
                    'id' => $order->id,
                    'public_id' => $order->public_id,
                    'status' => $order->status,
                    'total' => $order->total,
                    'placed_at' => $placedAt?->toIso8601String(),
                    'items_count' => $order->items_count,
                ];
            });

        return Inertia::render('account/orders/index', [
            'orders' => $orders,
        ]);
    }
}
