<?php

namespace App\Http\Resources;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One ledger row (docs/desain-v2.md B3.13). Money keys are ABSENT for Gudang (B7).
 * Load 'product.unit', 'project', 'creator' when they should be shown.
 *
 * @mixin StockMovement
 */
class StockMovementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $seeMoney = $request->user()->canSeeMoney();

        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'product' => $this->whenLoaded('product', fn () => [
                'id' => $this->product->id,
                'sku' => $this->product->sku,
                'name' => $this->product->name,
                'unit_symbol' => $this->product->unit->symbol,
            ]),
            'qty_change' => $this->qty_change,
            'qty_after' => $this->qty_after,
            'value_change' => $this->when($seeMoney, fn () => $this->value_change),
            'unit_cost' => $this->when($seeMoney, fn () => $this->unit_cost),
            'value_after' => $this->when($seeMoney, fn () => $this->value_after),
            'avg_cost_after' => $this->when($seeMoney, fn () => $this->avg_cost_after),
            'project' => $this->whenLoaded('project', fn () => $this->project
                ? ['id' => $this->project->id, 'code' => $this->project->code, 'name' => $this->project->name]
                : null),
            'reverses_movement_id' => $this->reverses_movement_id,
            'movement_date' => $this->movement_date->toDateString(),
            'notes' => $this->notes,
            'created_by' => $this->whenLoaded('creator', fn () => ['id' => $this->creator->id, 'name' => $this->creator->name]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
