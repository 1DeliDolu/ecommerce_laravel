<?php

use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\CartCheckoutController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('cart', fn () => Inertia::render('cart/index'))->name('cart.index');
Route::post('cart/checkout', CartCheckoutController::class)->name('cart.checkout');
Route::get('shop', [ShopController::class, 'index'])->name('shop.index');
Route::get('shop/{product}', [ShopController::class, 'show'])->name('shop.show');

Route::get('dashboard', DashboardController::class)
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::resource('products', ProductController::class)->middleware(['auth', 'verified']);

require __DIR__.'/settings.php';
require __DIR__.'/ecommerce.php';
