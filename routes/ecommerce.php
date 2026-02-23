<?php

use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\ProductImageController as AdminProductImageController;
use App\Http\Controllers\Shop\ProductController as ShopProductController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Shop Routes
|--------------------------------------------------------------------------
*/
Route::get('/products', [ShopProductController::class, 'index'])
    ->name('shop.products.index');

Route::get('/products/{product:slug}', [ShopProductController::class, 'show'])
    ->name('shop.products.show');

/*
|--------------------------------------------------------------------------
| Account Routes (Authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])
    ->prefix('account')
    ->as('account.')
    ->group(function () {
        // Coming soon:
        // Route::get('/orders', ...)->name('orders.index');
        // Route::resource('/addresses', ...);
        // Route::resource('/payment-methods', ...);
    });

/*
|--------------------------------------------------------------------------
| Admin Routes (Authenticated + Authorized)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'can:access-admin'])
    ->prefix('admin')
    ->as('admin.')
    ->group(function () {
        Route::resource('categories', AdminCategoryController::class);
        Route::resource('products', AdminProductController::class);

        // Product image upload / management
        Route::post('products/{product}/images', [AdminProductImageController::class, 'store'])
            ->name('products.images.store');

        Route::patch('product-images/{productImage}', [AdminProductImageController::class, 'update'])
            ->name('product-images.update');

        Route::delete('product-images/{productImage}', [AdminProductImageController::class, 'destroy'])
            ->name('product-images.destroy');
    });
