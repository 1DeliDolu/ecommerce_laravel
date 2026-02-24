<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\Gate;

class OrderPolicy
{
    /**
     * Admin kullanıcılar için global izin:
     * Projede tanımlı `access-admin` gate'i ile uyumlu.
     */
    public function before(User $user, string $ability): ?bool
    {
        if (Gate::forUser($user)->check('access-admin')) {
            return true;
        }

        return null;
    }

    public function viewAny(User $user): bool
    {
        // Kullanıcıya toplu listeleme yok (account/orders zaten controller seviyesinde filtreleniyor olmalı)
        return false;
    }

    /**
     * Kullanıcı kendi siparişini görebilir (ve faturayı indirebilir).
     */
    public function view(User $user, Order $order): bool
    {
        if (! empty($order->user_id)) {
            return (int) $order->user_id === (int) $user->id;
        }

        // Guest order fallback: email eşleştirmesi
        if (! empty($order->email) && ! empty($user->email)) {
            return strcasecmp((string) $order->email, (string) $user->email) === 0;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Order $order): bool
    {
        return false;
    }

    public function delete(User $user, Order $order): bool
    {
        return false;
    }

    public function restore(User $user, Order $order): bool
    {
        return false;
    }

    public function forceDelete(User $user, Order $order): bool
    {
        return false;
    }
}
