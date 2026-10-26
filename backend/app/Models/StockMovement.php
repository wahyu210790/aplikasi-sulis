<?php

namespace App\Models;

use App\Enums\MovementType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use LogicException;

/**
 * One ledger row (docs/desain-v2.md B3.13). APPEND-ONLY: never updated, never deleted.
 * Only App\Services\StockLedger may create rows. Mistakes are corrected with a reversal.
 */
class StockMovement extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = [
        'product_id', 'type', 'qty_change', 'value_change', 'unit_cost', 'qty_after', 'value_after', 'avg_cost_after',
        'project_id', 'stock_transaction_id', 'purchase_item_id', 'stock_opname_item_id', 'reverses_movement_id',
        'movement_date', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => MovementType::class,
            'qty_change' => 'decimal:3',
            'value_change' => 'integer',
            'unit_cost' => 'decimal:4',
            'qty_after' => 'decimal:3',
            'value_after' => 'integer',
            'avg_cost_after' => 'decimal:4',
            'movement_date' => 'date',
            'created_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::updating(function () {
            throw new LogicException('Stock movements are append-only and cannot be updated.');
        });
        static::deleting(function () {
            throw new LogicException('Stock movements are append-only and cannot be deleted.');
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function stockTransaction(): BelongsTo
    {
        return $this->belongsTo(StockTransaction::class);
    }

    /** The purchase line a purchase_in came from (no FK: see the migration). */
    public function purchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** The movement this reversal cancels (only for type reversal). */
    public function reverses(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reverses_movement_id');
    }

    /** The reversal that cancelled this movement, if any. */
    public function reversedBy(): HasOne
    {
        return $this->hasOne(self::class, 'reverses_movement_id');
    }
}
