<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class EnsureCartToken
{
    public const COOKIE_NAME = 'cart_token';

    public const COOKIE_MINUTES = 60 * 24 * 365; // 1 year

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Already has a valid token in cookie → nothing to do
        if ($request->cookie(self::COOKIE_NAME)) {
            return $response;
        }

        // Set a new long-lived token cookie (not http-only so JS can't read it,
        // but encrypted via Laravel's cookie encryption)
        return $response->withCookie(
            cookie(
                name: self::COOKIE_NAME,
                value: Str::random(40),
                minutes: self::COOKIE_MINUTES,
                path: '/',
                secure: false,
                httpOnly: true,
                sameSite: 'lax',
            )
        );
    }
}
