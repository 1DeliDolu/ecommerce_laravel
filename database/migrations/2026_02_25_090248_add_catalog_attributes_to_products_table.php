<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('brand', 120)->nullable()->after('name');
            $table->string('model_name', 120)->nullable()->after('brand');
            $table->string('product_type', 40)->nullable()->after('model_name');
            $table->string('color', 80)->nullable()->after('product_type');
            $table->string('material', 120)->nullable()->after('color');
            $table->json('available_clothing_sizes')->nullable()->after('material');
            $table->json('available_shoe_sizes')->nullable()->after('available_clothing_sizes');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'brand',
                'model_name',
                'product_type',
                'color',
                'material',
                'available_clothing_sizes',
                'available_shoe_sizes',
            ]);
        });
    }
};
