<?php

namespace App\Http\Resources;

use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * contract_value is money: the key is ABSENT for Gudang (B7).
 * summary {material_cost, other_costs, profit, margin_percent} is only added by GET /projects/{id}
 * (through withSummary()) and only for Owner/Finance (B9.2, B6).
 *
 * @mixin Project
 */
class ProjectResource extends JsonResource
{
    /** @var array{material_cost: int, other_costs: int, profit: int, margin_percent: float|null}|null */
    private ?array $summary = null;

    public function withSummary(array $summary): static
    {
        $this->summary = $summary;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'client_name' => $this->client_name,
            'location' => $this->location,
            'contract_value' => $this->when($request->user()->canSeeMoney(), fn () => $this->contract_value),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'notes' => $this->notes,
            'created_by' => $this->creator ? ['id' => $this->creator->id, 'name' => $this->creator->name] : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'summary' => $this->when($this->summary !== null && $request->user()->canSeeMoney(), fn () => $this->summary),
        ];
    }
}
