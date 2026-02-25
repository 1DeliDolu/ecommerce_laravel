<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use HasFactory;
    use SoftDeletes;

    public const TYPE_CLOTHING = 'clothing';

    public const TYPE_SHOES = 'shoes';

    public const TYPE_BAG = 'bag';

    public const TYPE_ACCESSORY = 'accessory';

    protected $fillable = [
        'name',
        'brand',
        'model_name',
        'product_type',
        'color',
        'material',
        'available_clothing_sizes',
        'available_shoe_sizes',
        'slug',
        'description',
        'price',
        'compare_at_price',
        'sku',
        'stock',
        'primary_category_id',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'compare_at_price' => 'decimal:2',
        'stock' => 'integer',
        'primary_category_id' => 'integer',
        'is_active' => 'boolean',
        'available_clothing_sizes' => 'array',
        'available_shoe_sizes' => 'array',
    ];

    /**
     * @return list<string>
     */
    public static function productTypes(): array
    {
        return [
            self::TYPE_CLOTHING,
            self::TYPE_SHOES,
            self::TYPE_BAG,
            self::TYPE_ACCESSORY,
        ];
    }

    /**
     * @return list<string>
     */
    public static function brandOptions(): array
    {
        return [
            'Nike',
            'Adidas',
            'Puma',
            'New Balance',
            'Asics',
            'Reebok',
            'Under Armour',
            'Converse',
        ];
    }

    /**
     * @return list<string>
     */
    public static function modelOptions(): array
    {
        return [
            'Pegasus 41',
            'Vomero 17',
            'Ultraboost',
            'Gazelle',
            'Suede Classic',
            '574 Core',
            'Gel-Kayano',
            'Club C 85',
        ];
    }

    /**
     * @return list<string>
     */
    public static function colorOptions(): array
    {
        return [
            'Black',
            'White',
            'Gray',
            'Navy',
            'Red',
            'Blue',
            'Green',
            'Beige',
        ];
    }

    /**
     * @return list<string>
     */
    public static function clothingSizeOptions(): array
    {
        return ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
    }

    /**
     * @return list<string>
     */
    public static function shoeSizeOptions(): array
    {
        return ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    public function primaryImage(): HasOne
    {
        return $this->hasOne(ProductImage::class)
            ->where('is_primary', true)
            ->orderBy('sort_order');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(Category::class)->withTimestamps();
    }

    public function primaryCategory(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'primary_category_id');
    }
}
