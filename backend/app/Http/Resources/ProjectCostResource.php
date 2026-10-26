<?php

namespace App\Http\Resources;

use App\Models\ProjectCost;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Other project cost (docs/desain-v2.md B3.9). Only Owner/Finance can call these routes;
 * amount is still wrapped like every money field (B7). Load 'creator' and 'updater'.
 *
 * @mixin ProjectCost
 */
class ProjectCostResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'cost_date' => $this->cost_date->toDateString(),
            'description' => $this->description,
            'amount' => $this->when($request->user()->canSeeMoney(), fn () => $this->amount),
            'created_by' => $this->whenLoaded('creator', fn () => ['id' => $this->creator->id, 'name' => $this->creator->name]),
            'updated_by' => $this->whenLoaded('updater', fn () => $this->updater ? ['id' => $this->updater->id, 'name' => $this->updater->name] : null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
