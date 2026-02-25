<?php

namespace App\Policies;

use App\Models\PaymentMethod;
use App\Models\User;

class PaymentMethodPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, PaymentMethod $paymentMethod): bool
    {
        return $paymentMethod->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, PaymentMethod $paymentMethod): bool
    {
        return $paymentMethod->user_id === $user->id;
    }

    public function delete(User $user, PaymentMethod $paymentMethod): bool
    {
        return $paymentMethod->user_id === $user->id;
    }

    public function restore(User $user, PaymentMethod $paymentMethod): bool
    {
        return $paymentMethod->user_id === $user->id;
    }

    public function forceDelete(User $user, PaymentMethod $paymentMethod): bool
    {
        return $paymentMethod->user_id === $user->id;
    }
}
