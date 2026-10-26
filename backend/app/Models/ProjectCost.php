<?php

namespace App\Models;

use Database\Factories\ProjectCostFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Other project cost (docs/desain-v2.md B3.9). amount is money: Owner/Finance only (B6, B7). */
class ProjectCost extends Model
{
    /** @use HasFactory<ProjectCostFactory> */
    use HasFactory;

    protected $fillable = ['project_id', 'cost_date', 'description', 'amount', 'created_by', 'updated_by'];

    protected function casts(): array
    {
        return [
            'cost_date' => 'date',
            'amount' => 'integer',
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

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
