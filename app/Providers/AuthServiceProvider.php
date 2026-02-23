<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use App\Policies\CategoryPolicy;
use App\Policies\ProductImagePolicy;
use App\Policies\ProductPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Category::class => CategoryPolicy::class,
        Product::class => ProductPolicy::class,
        ProductImage::class => ProductImagePolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        Gate::define('access-admin', function (User $user): bool {
            $allowed = collect(explode(',', (string) env('ADMIN_EMAILS', '')))
                ->map(fn (string $email) => Str::lower(trim($email)))
                ->filter()
                ->values();

            if ($allowed->isEmpty()) {
                return false;
            }

            return $allowed->contains(Str::lower($user->email));
        });
    }
}
