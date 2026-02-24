<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // Auth ise dolu, guest checkout ise null kalabilir
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            // Dış dünyaya gösterilecek referans (sipariş no gibi)
            $table->uuid('public_id')->unique();

            // Basit lifecycle (ileride büyütürüz)
            $table->string('status', 20)->default('pending')->index(); // pending|paid|cancelled|shipped...

            // Snapshot: checkout anındaki müşteri bilgileri
            $table->string('first_name', 80);
            $table->string('last_name', 80);
            $table->string('email', 255);
            $table->string('phone', 30)->nullable();

            // Snapshot: teslimat adresi
            $table->string('address1', 255);
            $table->string('address2', 255)->nullable();
            $table->string('city', 120);
            $table->string('postal_code', 20);
            $table->string('country', 120);

            // Para birimi + totals (cents)
            $table->char('currency', 3)->default('EUR');
            $table->unsignedBigInteger('subtotal_cents');
            $table->unsignedBigInteger('tax_cents')->default(0);
            $table->unsignedBigInteger('shipping_cents')->default(0);
            $table->unsignedBigInteger('total_cents');

            $table->timestamps();

            $table->index(['user_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            // Ürün silinse bile sipariş satırı kalabilsin diye nullable + snapshot alanlar
            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->string('product_name', 255);
            $table->string('product_slug', 255)->nullable();

            $table->unsignedInteger('quantity');
            $table->unsignedBigInteger('unit_price_cents');
            $table->unsignedBigInteger('line_total_cents');

            $table->timestamps();

            $table->index(['order_id']);
            $table->index(['product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
