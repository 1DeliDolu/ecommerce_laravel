<?php

namespace App\Listeners;

use App\Http\Middleware\EnsureCartToken;
use App\Services\CartService;
use Illuminate\Auth\Events\Login;

class MergeGuestCart
{
    public function __construct(private readonly CartService $cartService) {}

    public function handle(Login $event): void
    {
        $token = request()->cookie(EnsureCartToken::COOKIE_NAME);

        if (! $token) {
            return;
        }

        $this->cartService->mergeGuestIntoUser($event->user, $token);
    }
}
