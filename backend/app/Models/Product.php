<?php

namespace App\Models;

use App\Support\Dec;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/** Product / item (docs/desain-v2.md B3.5). Never deleted: use is_active. */
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory;

    protected $fillable = ['sku', 'name', 'category_id', 'unit_id', 'min_stock', 'notes', 'is_active'];

    protected function casts(): array
    {
        return [
            'min_stock' => 'decimal:3',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        // B3.6: the balance row is created in the same transaction as the product.
        static::created(function (Product $product) {
            $product->stockBalance()->create([
                'qty' => '0',
                'stock_value' => 0,
                'avg_cost' => '0',
                'has_cost' => false,
            ]);
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    public function stockBalance(): HasOne
    {
        return $this->hasOne(StockBalance::class);
    }

    /** Low stock = a threshold is set (min_stock > 0) and qty <= min_stock. */
    public function isLowStock(): bool
    {
        $qty = $this->stockBalance?->qty ?? '0';

        return Dec::cmp($this->min_stock, '0') > 0 && Dec::cmp($qty, $this->min_stock) <= 0;
    }
}
