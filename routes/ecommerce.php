<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])
    ->prefix('account')
    ->as('account.')
    ->group(function () {
        Route::get('orders', fn () => Inertia::render('account/orders/index'))->name('orders.index');
        Route::get('addresses', fn () => Inertia::render('account/addresses/index'))->name('addresses.index');
        Route::get('payment-methods', fn () => Inertia::render('account/payment-methods/index'))->name('payment-methods.index');
    });

Route::middleware(['auth', 'verified', 'can:access-admin'])
    ->prefix('admin')
    ->as('admin.')
    ->group(function () {
        Route::get('overview', fn () => Inertia::render('admin/overview/index'))->name('overview.index');
        Route::get('categories', fn () => Inertia::render('admin/categories/index'))->name('categories.index');
        Route::get('products', fn () => Inertia::render('admin/products/index'))->name('products.index');
        Route::get('orders', fn () => Inertia::render('admin/orders/index'))->name('orders.index');
    });
