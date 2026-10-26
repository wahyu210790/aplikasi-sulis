<?php

namespace App\Models;

use App\Enums\StockTransactionStatus;
use App\Enums\StockTransactionType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Header of a stock-out (BK-) or return (RT-) document (docs/desain-v2.md B3.12). Never deleted. */
class StockTransaction extends Model
{
    protected $fillable = [
        'number', 'type', 'project_id', 'person_name', 'transaction_date', 'notes', 'status',
        'reversed_by', 'reversed_at', 'reverse_reason', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'type' => StockTransactionType::class,
            'status' => StockTransactionStatus::class,
            'transaction_date' => 'date',
            'reversed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reverser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }

    /** All ledger rows of this document, including reversal rows (ordered by id). */
    public function movements(): HasMany
    {
        return $this->hasMany(StockMovement::class)->orderBy('id');
    }
}
