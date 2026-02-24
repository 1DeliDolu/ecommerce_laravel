<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\PaymentMethod;
use App\Policies\CategoryPolicy;
use App\Policies\PaymentMethodPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Category::class => CategoryPolicy::class,
        PaymentMethod::class => PaymentMethodPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();
    }
}
