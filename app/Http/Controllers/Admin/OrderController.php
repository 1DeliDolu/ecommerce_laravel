<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateOrderStatusRequest;
use App\Mail\OrderStatusUpdated;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q', ''));
        $status = (string) $request->query('status', 'all');
        $dateFrom = (string) $request->query('date_from', '');
        $dateTo = (string) $request->query('date_to', '');

        $orders = Order::query()
            ->withCount('items')
            ->when($q !== '', function ($query) use ($q) {
                $query->where(function ($sub) use ($q) {
                    $sub->where('public_id', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when($status !== '' && $status !== 'all', fn ($query) => $query->where('status', $status))
            ->when($dateFrom !== '', fn ($query) => $query->whereDate('created_at', '>=', $dateFrom))
            ->when($dateTo !== '', fn ($query) => $query->whereDate('created_at', '<=', $dateTo))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/orders/index', [
            'orders' => $orders,
            'filters' => [
                'q' => $q,
                'status' => $status,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'statuses' => Order::statuses(),
        ]);
    }

    public function show(Order $order): Response
    {
        $order->load([
            'items',
            'user:id,name,email',
        ]);

        return Inertia::render('admin/orders/show', [
            'order' => $order,
            'allowedStatuses' => $order->allowedStatusesForUpdate(),
        ]);
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $previousStatus = $order->status;
        $status = (string) $request->string('status');

        if ($previousStatus === $status) {
            return back()->with('info', 'Order status is unchanged.');
        }

        $order->update(['status' => $status]);
        $this->sendStatusEmailIfNeeded($order, $previousStatus, $status);

        return to_route('admin.orders.show', $order)->with('success', 'Order status updated.');
    }

    private function sendStatusEmailIfNeeded(Order $order, string $previousStatus, string $currentStatus): void
    {
        if (! in_array($currentStatus, [Order::STATUS_SHIPPED, Order::STATUS_CANCELLED], true)) {
            return;
        }

        Mail::to($order->email)->send(new OrderStatusUpdated(
            order: $order,
            previousStatus: $previousStatus,
            currentStatus: $currentStatus,
        ));
    }
}
