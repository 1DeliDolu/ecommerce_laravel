<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    private function isAdmin(User $user): bool
    {
        return $user->can('access-admin');
    }

    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(User $user, Product $product): bool
    {
        return $this->isAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function update(User $user, Product $product): bool
    {
        return $this->isAdmin($user);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->isAdmin($user);
    }

    public function restore(User $user, Product $product): bool
    {
        return $this->isAdmin($user);
    }

    public function forceDelete(User $user, Product $product): bool
    {
        return $this->isAdmin($user);
    }
}
