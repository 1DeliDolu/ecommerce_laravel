<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        if (Schema::hasColumn('products', 'primary_category_id')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('primary_category_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('products')) {
            return;
        }

        if (! Schema::hasColumn('products', 'primary_category_id')) {
            return;
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('primary_category_id');
        });
    }
};
