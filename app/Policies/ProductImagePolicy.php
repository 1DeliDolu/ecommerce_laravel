<?php

namespace App\Policies;

use App\Models\ProductImage;
use App\Models\User;

class ProductImagePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('access-admin');
    }

    public function delete(User $user, ProductImage $productImage): bool
    {
        return $user->can('access-admin');
    }

    public function forceDelete(User $user, ProductImage $productImage): bool
    {
        return $user->can('access-admin');
    }

    public function restore(User $user, ProductImage $productImage): bool
    {
        return $user->can('access-admin');
    }

    public function update(User $user, ProductImage $productImage): bool
    {
        return $user->can('access-admin');
    }
}
