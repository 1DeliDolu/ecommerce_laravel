<?php

namespace App\Models;

use App\Enums\CustomerTier;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    /** @use HasFactory<\Database\Factories\OrderFactory> */
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_SHIPPED = 'shipped';

    public const STATUS_CANCELLED = 'cancelled';

    protected $fillable = [
        'public_id',
        'user_id',
        'status',
        'customer_tier',
        'email',
        'first_name',
        'last_name',
        'customer_name',
        'phone',
        'address1',
        'address2',
        'city',
        'postal_code',
        'country',
        'currency',
        'subtotal_cents',
        'shipping_cents',
        'tax_cents',
        'total_cents',
        'subtotal',
        'shipping_total',
        'tax_total',
        'total',
        'shipping_address_snapshot',
        'placed_at',
    ];

    protected $casts = [
        'customer_tier' => CustomerTier::class,
        'shipping_address_snapshot' => 'array',
        'placed_at' => 'datetime',
    ];

    protected $appends = [
        'customer_name',
        'shipping_address_snapshot',
        'subtotal',
        'shipping_total',
        'tax_total',
        'total',
    ];

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return list<string>
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_PAID,
            self::STATUS_SHIPPED,
            self::STATUS_CANCELLED,
        ];
    }

    /**
     * @return array<string, list<string>>
     */
    public static function transitions(): array
    {
        return [
            self::STATUS_PENDING => [self::STATUS_PAID, self::STATUS_CANCELLED],
            self::STATUS_PAID => [self::STATUS_SHIPPED, self::STATUS_CANCELLED],
            self::STATUS_SHIPPED => [],
            self::STATUS_CANCELLED => [],
        ];
    }

    public function canTransitionTo(string $status): bool
    {
        if ($this->status === $status) {
            return true;
        }

        return in_array($status, self::transitions()[$this->status] ?? [], true);
    }

    /**
     * @return list<string>
     */
    public function allowedStatusesForUpdate(): array
    {
        return [
            $this->status,
            ...(self::transitions()[$this->status] ?? []),
        ];
    }

    public function getCustomerNameAttribute(?string $value): ?string
    {
        if (is_string($value) && trim($value) !== '') {
            return $value;
        }

        $firstName = (string) ($this->attributes['first_name'] ?? '');
        $lastName = (string) ($this->attributes['last_name'] ?? '');
        $fullName = trim($firstName.' '.$lastName);

        return $fullName !== '' ? $fullName : null;
    }

    /**
     * @return array<string, string|null>|null
     */
    public function getShippingAddressSnapshotAttribute(mixed $value): ?array
    {
        if (is_array($value)) {
            return $value;
        }

        if (is_string($value) && trim($value) !== '') {
            $decoded = json_decode($value, true);

            if (is_array($decoded)) {
                return $decoded;
            }
        }

        $line1 = $this->attributes['address1'] ?? null;
        $line2 = $this->attributes['address2'] ?? null;
        $city = $this->attributes['city'] ?? null;
        $postalCode = $this->attributes['postal_code'] ?? null;
        $country = $this->attributes['country'] ?? null;

        if (
            $line1 === null &&
            $line2 === null &&
            $city === null &&
            $postalCode === null &&
            $country === null
        ) {
            return null;
        }

        return [
            'line1' => is_string($line1) ? $line1 : null,
            'line2' => is_string($line2) ? $line2 : null,
            'city' => is_string($city) ? $city : null,
            'state' => null,
            'postal_code' => is_string($postalCode) ? $postalCode : null,
            'country' => is_string($country) ? $country : null,
        ];
    }

    public function getSubtotalAttribute(mixed $value): string
    {
        return $this->resolveMoneyValue($value, 'subtotal_cents');
    }

    public function getShippingTotalAttribute(mixed $value): string
    {
        return $this->resolveMoneyValue($value, 'shipping_cents');
    }

    public function getTaxTotalAttribute(mixed $value): string
    {
        return $this->resolveMoneyValue($value, 'tax_cents');
    }

    public function getTotalAttribute(mixed $value): string
    {
        return $this->resolveMoneyValue($value, 'total_cents');
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
