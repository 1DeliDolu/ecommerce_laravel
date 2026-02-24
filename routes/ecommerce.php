<?php

use App\Http\Controllers\Account\AddressController as AccountAddressController;
use App\Http\Controllers\Account\OrderController as AccountOrderController;
use App\Http\Controllers\Account\PaymentMethodController as AccountPaymentMethodController;
use App\Http\Controllers\Admin\AnalyticsController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductImageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])
    ->prefix('account')
    ->as('account.')
    ->group(function () {
        Route::get('orders', AccountOrderController::class)->name('orders.index');
        Route::patch('addresses/{address}/default', [AccountAddressController::class, 'setDefault'])
            ->name('addresses.setDefault');
        Route::resource('addresses', AccountAddressController::class)
            ->only(['index', 'store', 'update', 'destroy']);
        Route::patch('payment-methods/{payment_method}/default', [AccountPaymentMethodController::class, 'setDefault'])
            ->name('payment-methods.setDefault');
        Route::resource('payment-methods', AccountPaymentMethodController::class)
            ->only(['index', 'store', 'update', 'destroy']);
    });

Route::middleware(['auth', 'verified', 'can:access-admin'])
    ->prefix('admin')
    ->as('admin.')
    ->group(function () {
        Route::get('overview', fn () => Inertia::render('admin/overview/index'))->name('overview.index');
        Route::get('product-images/trashed', [ProductImageController::class, 'trashed'])->name('product-images.trashed');
        Route::patch('product-images/{productImage}/restore', [ProductImageController::class, 'restore'])
            ->withTrashed()
            ->name('product-images.restore');
        Route::delete('product-images/{productImage}/force-delete', [ProductImageController::class, 'forceDelete'])
            ->withTrashed()
            ->name('product-images.forceDelete');

        Route::resource('orders', OrderController::class)->only(['index', 'show']);
        Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus'])->name('orders.updateStatus');
        Route::get('analytics/bootstrap', [AnalyticsController::class, 'bootstrap'])->name('analytics.bootstrap');
        Route::get('analytics/category-products', [AnalyticsController::class, 'categoryProducts'])->name('analytics.category-products');
        Route::get('analytics/timeseries', [AnalyticsController::class, 'timeseries'])->name('analytics.timeseries');
        Route::resource('categories', CategoryController::class);
        Route::resource('products', ProductController::class);
    });
