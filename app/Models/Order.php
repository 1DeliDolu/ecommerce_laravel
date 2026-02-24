<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'public_id',
        'status',

        'first_name',
        'last_name',
        'email',
        'phone',

        'address1',
        'address2',
        'city',
        'postal_code',
        'country',

        'currency',
        'subtotal_cents',
        'tax_cents',
        'shipping_cents',
        'total_cents',
    ];

    protected $casts = [
        'subtotal_cents' => 'integer',
        'tax_cents' => 'integer',
        'shipping_cents' => 'integer',
        'total_cents' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $order) {
            if (empty($order->public_id)) {
                $order->public_id = (string) Str::uuid();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
