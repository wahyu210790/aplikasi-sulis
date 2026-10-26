<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Project (docs/desain-v2.md B3.8). contract_value is money: hidden from Gudang (B7). Never deleted: use status batal. */
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'code', 'name', 'client_name', 'location', 'contract_value',
        'start_date', 'end_date', 'status', 'notes', 'created_by',
    ];

    protected function casts(): array
    {
        return [
            'contract_value' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => ProjectStatus::class,
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
