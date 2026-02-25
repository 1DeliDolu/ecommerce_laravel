<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user()?->loadMissing('defaultAddress', 'defaultPaymentMethod');
        $defaultPaymentMethod = $user?->defaultPaymentMethod;

        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $user,
                'default_address' => $user?->defaultAddress === null ? null : [
                    'id' => $user->defaultAddress->id,
                    'label' => $user->defaultAddress->label,
                    'first_name' => $user->defaultAddress->first_name,
                    'last_name' => $user->defaultAddress->last_name,
                    'phone' => $user->defaultAddress->phone,
                    'line1' => $user->defaultAddress->line1,
                    'line2' => $user->defaultAddress->line2,
                    'city' => $user->defaultAddress->city,
                    'state' => $user->defaultAddress->state,
                    'postal_code' => $user->defaultAddress->postal_code,
                    'country' => $user->defaultAddress->country,
                    'is_default' => $user->defaultAddress->is_default,
                ],
                'default_payment_method' => $defaultPaymentMethod === null ? null : [
                    'id' => $defaultPaymentMethod->id,
                    'label' => $defaultPaymentMethod->label,
                    'card_holder_name' => $defaultPaymentMethod->card_holder_name ?? $defaultPaymentMethod->cardholder_name,
                    'brand' => $defaultPaymentMethod->brand,
                    'last_four' => $defaultPaymentMethod->last_four ?? $defaultPaymentMethod->last4,
                    'expiry_month' => $defaultPaymentMethod->expiry_month ?? $defaultPaymentMethod->exp_month,
                    'expiry_year' => $defaultPaymentMethod->expiry_year ?? $defaultPaymentMethod->exp_year,
                    'is_default' => $defaultPaymentMethod->is_default,
                ],
                'can' => [
                    'access_admin' => $user?->can('access-admin') ?? false,
                ],
            ],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],
        ]);
    }
}
