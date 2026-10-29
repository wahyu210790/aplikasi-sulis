<?php

namespace App\Models;

use App\Enums\OpnameStatus;
use Database\Factories\StockOpnameFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Stock opname header (docs/desain-v2.md B3.14, B5.5). Never deleted: cancelled opnames keep status batal. */
class StockOpname extends Model
{
    /** @use HasFactory<StockOpnameFactory> */
    use HasFactory;

    protected $fillable = [
        'number', 'opname_date', 'status', 'notes', 'created_by',
        'submitted_by', 'submitted_at', 'posted_by', 'posted_at', 'cancelled_by', 'cancelled_at',
        'rejected_by', 'rejected_at', 'reject_reason',
    ];

    protected function casts(): array
    {
        return [
            'opname_date' => 'date',
            'status' => OpnameStatus::class,
            'submitted_at' => 'datetime',
            'posted_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class)->orderBy('id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function poster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function rejecter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
