<?php

use App\Http\Controllers\Account\OrderController as AccountOrderController;
use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\ProductImageController as AdminProductImageController;
use App\Http\Controllers\Admin\TrashedProductImageController as AdminTrashedProductImageController;
use App\Http\Controllers\Shop\CartController as ShopCartController;
use App\Http\Controllers\Shop\CheckoutController as ShopCheckoutController;
use App\Http\Controllers\Shop\InvoiceController as ShopInvoiceController;
use App\Http\Controllers\Shop\ProductController as ShopProductController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Shop Routes (Public)
|--------------------------------------------------------------------------
*/
Route::prefix('cart')
    ->as('shop.cart.')
    ->group(function () {
        Route::get('/', [ShopCartController::class, 'index'])->name('index');
        Route::post('/', [ShopCartController::class, 'store'])->name('store');
        Route::patch('items/{productId}', [ShopCartController::class, 'update'])->name('update');
        Route::delete('items/{productId}', [ShopCartController::class, 'destroy'])->name('destroy');
        Route::delete('/', [ShopCartController::class, 'clear'])->name('clear');
    });

Route::get('checkout', [ShopCheckoutController::class, 'index'])->name('shop.checkout.index');
Route::post('checkout', [ShopCheckoutController::class, 'store'])->name('shop.checkout.store');
Route::get('checkout/success/{publicId}', [ShopCheckoutController::class, 'success'])->name('shop.checkout.success');

Route::prefix('products')
    ->as('shop.products.')
    ->group(function () {
        Route::get('/', [ShopProductController::class, 'index'])->name('index');
        Route::get('{slug}', [ShopProductController::class, 'show'])->name('show');
    });

/*
|--------------------------------------------------------------------------
| Account Routes (Authenticated)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified'])
    ->prefix('account')
    ->as('account.')
    ->group(function () {
        Route::get('orders', [AccountOrderController::class, 'index'])->name('orders.index');
        Route::get('addresses', fn () => Inertia::render('account/addresses/index'))->name('addresses.index');
        Route::get('payment-methods', fn () => Inertia::render('account/payment-methods/index'))->name('payment-methods.index');

        /**
         * Invoice PDF Download
         * Kullanıcı kendi siparişinin faturasını indirebilir.
         */
        Route::get('orders/{order}/invoice', [ShopInvoiceController::class, 'download'])
            ->name('orders.invoice');

        /**
         * PublicId ile indirme (success sayfasındaki publicId ile uyumlu)
         */
        Route::get('invoices/{publicId}', [ShopInvoiceController::class, 'downloadByPublicId'])
            ->name('invoices.download');
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
        Route::get('overview', fn () => Inertia::render('admin/overview/index'))->name('overview.index');
        Route::get('orders', fn () => Inertia::render('admin/orders/index'))->name('orders.index');

        Route::resource('categories', AdminCategoryController::class);
        Route::resource('products', AdminProductController::class);

        // Trashed product images list
        Route::get('product-images/trashed', [AdminTrashedProductImageController::class, 'index'])
            ->name('product-images.trashed');

        // Product image upload / management
        Route::post('products/{product}/images', [AdminProductImageController::class, 'store'])
            ->name('products.images.store');

        Route::patch('product-images/{productImage}', [AdminProductImageController::class, 'update'])
            ->name('product-images.update');

        // Soft delete
        Route::delete('product-images/{productImage}', [AdminProductImageController::class, 'destroy'])
            ->name('product-images.destroy');

        // Restore (needs trashed model binding)
        Route::patch('product-images/{productImage}/restore', [AdminProductImageController::class, 'restore'])
            ->withTrashed()
            ->name('product-images.restore');

        // Force delete (permanent) - allow trashed binding too
        Route::delete('product-images/{productImage}/force', [AdminProductImageController::class, 'forceDestroy'])
            ->withTrashed()
            ->name('product-images.force-destroy');
    });
