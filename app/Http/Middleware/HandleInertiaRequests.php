<?php

namespace App\Http\Middleware;

use App\Services\CartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    public function __construct(private readonly CartService $cartService) {}

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
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user(),
                'is_admin' => $request->user()
                    ? Gate::forUser($request->user())->check('access-admin')
                    : false,
                'tier' => $request->user()?->tier?->value,
            ],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'warning' => fn () => $request->session()->get('warning'),
                'info' => fn () => $request->session()->get('info'),
            ],

            'cart' => function () use ($request): array {
                $cart = $this->cartService->resolve(
                    $request->user(),
                    $request->cookie(EnsureCartToken::COOKIE_NAME),
                );

                if (! $cart->exists) {
                    return ['items_count' => 0];
                }

                $itemsCount = $cart->items()->sum('quantity');

                return ['items_count' => (int) $itemsCount];
            },
        ]);
    }
}
