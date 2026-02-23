<?php

namespace App\Policies;

use App\Models\Category;
use App\Models\User;

class CategoryPolicy
{
    private function isAdmin(User $user): bool
    {
        return $user->can('access-admin');
    }

    public function viewAny(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(User $user, Category $category): bool
    {
        return $this->isAdmin($user);
    }

    public function create(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function update(User $user, Category $category): bool
    {
        return $this->isAdmin($user);
    }

    public function delete(User $user, Category $category): bool
    {
        return $this->isAdmin($user);
    }

    public function restore(User $user, Category $category): bool
    {
        return $this->isAdmin($user);
    }

    public function forceDelete(User $user, Category $category): bool
    {
        return $this->isAdmin($user);
    }
}
