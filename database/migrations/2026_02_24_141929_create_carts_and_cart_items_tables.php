<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();

            // Auth cart: user_id dolu
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // Guest cart: cookie'de saklanacak stabil token (auth cart için null kalabilir)
            $table->string('token', 64)
                ->nullable()
                ->unique();

            // Gelecekte order'a dönüşüm / abandon gibi durumlar için
            $table->string('status', 20)->default('active')->index(); // active|converted|abandoned (ileride)

            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cart_id')
                ->constrained('carts')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->unsignedInteger('quantity')->default(1);

            // Price snapshot: sepete eklenirken/ güncellenirken ürün fiyatından kopyalanır
            $table->decimal('unit_price', 12, 2);

            $table->timestamps();

            // Aynı sepette aynı ürün tek satır olsun (qty artar/azalır)
            $table->unique(['cart_id', 'product_id']);

            $table->index(['cart_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
    }
};