<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    /** @use HasFactory<\Database\Factories\OrderItemFactory> */
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'product_name',
        'product_slug',
        'product_sku',
        'quantity',
        'unit_price_cents',
        'line_total_cents',
        'unit_price',
        'line_total',
    ];

    protected $casts = [
        'quantity' => 'integer',
    ];

    protected $appends = [
        'product_sku',
        'unit_price',
        'line_total',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function getProductSkuAttribute(?string $value): ?string
    {
        if (is_string($value) && trim($value) !== '') {
            return $value;
        }

        $slug = $this->attributes['product_slug'] ?? null;

        return is_string($slug) && trim($slug) !== '' ? $slug : null;
    }

    public function getUnitPriceAttribute(mixed $value): string
    {
        return $this->resolveMoneyValue($value, 'unit_price_cents');
    }

    public function getLineTotalAttribute(mixed $value): string
    {
        return $this->resolveMoneyValue($value, 'line_total_cents');
    }

    private function resolveMoneyValue(mixed $decimalValue, string $centsKey): string
    {
        if ($decimalValue !== null && $decimalValue !== '') {
            return number_format((float) $decimalValue, 2, '.', '');
        }

        $cents = $this->attributes[$centsKey] ?? null;

        if ($cents === null || $cents === '') {
            return '0.00';
        }

        return number_format(((int) $cents) / 100, 2, '.', '');
    }
}
