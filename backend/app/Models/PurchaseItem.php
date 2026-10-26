<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Purchase line (docs/desain-v2.md B3.11). unit_price and line_total are money (B7). */
class PurchaseItem extends Model
{
    protected $fillable = ['purchase_id', 'product_id', 'qty', 'unit_price', 'line_total'];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
            'unit_price' => 'integer',
            'line_total' => 'integer',
        ];
    }

    public function purchase(): BelongsTo
    {
        return $this->belongsTo(Purchase::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
