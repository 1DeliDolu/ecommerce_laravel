<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentMethod extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentMethodFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'label',
        'card_holder_name',
        'cardholder_name',
        'brand',
        'last_four',
        'last4',
        'expiry_month',
        'exp_month',
        'expiry_year',
        'exp_year',
        'is_default',
    ];

    protected $casts = [
        'expiry_month' => 'integer',
        'expiry_year' => 'integer',
        'exp_month' => 'integer',
        'exp_year' => 'integer',
        'is_default' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
