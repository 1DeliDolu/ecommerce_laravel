<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;

class ProductImagePolicy
{
    /**
     * Grant all abilities to admin users (based on your existing Gate: access-admin).
     */
    public function before(User $user): ?bool
    {
        return $user->can('access-admin') ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return false;
    }

    public function view(User $user, ProductImage $productImage): bool
    {
        return false;
    }

    /**
     * Called via: $user->can('create', [ProductImage::class, $product])
     */
    public function create(User $user, Product $product): bool
    {
        return false;
    }

    public function update(User $user, ProductImage $productImage): bool
    {
        return false;
    }

    public function delete(User $user, ProductImage $productImage): bool
    {
        return false;
    }
}