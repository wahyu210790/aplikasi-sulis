<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** One counted product of a stock opname (docs/desain-v2.md B3.15). Quantities only, never money. */
class StockOpnameItem extends Model
{
    protected $fillable = ['stock_opname_id', 'product_id', 'system_qty', 'counted_qty', 'diff_qty', 'notes'];

    protected function casts(): array
    {
        return [
            'system_qty' => 'decimal:3',
            'counted_qty' => 'decimal:3',
            'diff_qty' => 'decimal:3',
        ];
    }

    public function stockOpname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
