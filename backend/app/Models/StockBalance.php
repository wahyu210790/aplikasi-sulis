<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Current stock of one product (docs/desain-v2.md B3.6).
 * Fase 2 only creates the row (qty 0). Only the stock service (Fase 3) may change it.
 */
class StockBalance extends Model
{
    public const CREATED_AT = null;

    protected $fillable = ['product_id', 'qty', 'stock_value', 'avg_cost', 'has_cost'];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
            'stock_value' => 'integer',
            'avg_cost' => 'decimal:4',
            'has_cost' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
