<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('order_items')) {
            return;
        }

        $hasVariantKey = Schema::hasColumn('order_items', 'variant_key');
        $hasSelectedOptions = Schema::hasColumn('order_items', 'selected_options');

        if ($hasVariantKey && $hasSelectedOptions) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table) use ($hasVariantKey, $hasSelectedOptions) {
            if (! $hasVariantKey) {
                $table->string('variant_key', 120)->nullable();
            }

            if (! $hasSelectedOptions) {
                $table->json('selected_options')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('order_items')) {
            return;
        }

        $hasVariantKey = Schema::hasColumn('order_items', 'variant_key');
        $hasSelectedOptions = Schema::hasColumn('order_items', 'selected_options');

        if (! $hasVariantKey && ! $hasSelectedOptions) {
            return;
        }

        Schema::table('order_items', function (Blueprint $table) use ($hasVariantKey, $hasSelectedOptions) {
            if ($hasSelectedOptions) {
                $table->dropColumn('selected_options');
            }

            if ($hasVariantKey) {
                $table->dropColumn('variant_key');
            }
        });
    }
};
