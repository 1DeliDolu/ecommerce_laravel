<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    public function index(Request $request): Response
    {
        // Şimdilik sadece checkout ekranını render ediyoruz.
        // Bir sonraki adımlarda: cart + address + totals + payment simulate buraya bağlanacak.
        return Inertia::render('checkout/index');
    }
}