<?php

namespace App\Http\Controllers\Account;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AddressController extends Controller
{
    public function index(Request $request): Response
    {
        $addresses = Order::query()
            ->where('user_id', $request->user()->id)
            ->whereNotNull('address1')
            ->select([
                'first_name',
                'last_name',
                'address1',
                'address2',
                'city',
                'postal_code',
                'country',
                DB::raw('COUNT(*) as order_count'),
                DB::raw('MAX(created_at) as last_used_at'),
            ])
            ->groupBy('first_name', 'last_name', 'address1', 'address2', 'city', 'postal_code', 'country')
            ->orderByDesc('last_used_at')
            ->get()
            ->map(fn ($row) => [
                'full_name' => trim("{$row->first_name} {$row->last_name}"),
                'address1' => $row->address1,
                'address2' => $row->address2,
                'city' => $row->city,
                'postal_code' => $row->postal_code,
                'country' => $row->country,
                'order_count' => (int) $row->order_count,
                'last_used_at' => $row->last_used_at,
            ]);

        return Inertia::render('account/addresses/index', [
            'addresses' => $addresses,
        ]);
    }
}
