<?php

namespace App\Models;

use App\Enums\PurchaseStatus;
use Database\Factories\PurchaseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Purchase (docs/desain-v2.md B3.10). total_value is money: hidden from Gudang (B7). */
class Purchase extends Model
{
    /** @use HasFactory<PurchaseFactory> */
    use HasFactory;

    protected $fillable = [
        'number', 'supplier_id', 'purchase_date', 'invoice_no', 'status', 'total_value', 'notes',
        'created_by', 'received_by', 'received_at', 'cancelled_by', 'cancelled_at', 'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'status' => PurchaseStatus::class,
            'total_value' => 'integer',
            'received_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class)->orderBy('id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }
}
