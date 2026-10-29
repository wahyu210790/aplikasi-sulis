<?php

namespace App\Http\Resources;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One ledger row (docs/desain-v2.md B3.13, B9.2). Money keys are ABSENT for Gudang (B7).
 * Load StockMovementResource::RELATIONS so product, project, document and user can be shown.
 *
 * document: the paper behind the movement, or null (opening stock):
 *   {"kind": "stock_transaction", "id": 12, "number": "BK-000012"}, {"kind": "purchase", "id": 3, "number": "PB-000003"}
 *   or {"kind": "stock_opname", "id": 2, "number": "SO-000002"}.
 * A reversal points to the same document as the movement it cancels.
 *
 * @mixin StockMovement
 */
class StockMovementResource extends JsonResource
{
    public const RELATIONS = [
        'product.unit', 'project', 'creator', 'stockTransaction',
        'purchaseItem.purchase', 'reverses.purchaseItem.purchase', 'stockOpnameItem.stockOpname',
    ];

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
            'document' => $this->document(),
            'person_name' => $this->relationLoaded('stockTransaction') ? $this->stockTransaction?->person_name : null,
            'reverses_movement_id' => $this->reverses_movement_id,
            'movement_date' => $this->movement_date->toDateString(),
            'notes' => $this->notes,
            'created_by' => $this->whenLoaded('creator', fn () => ['id' => $this->creator->id, 'name' => $this->creator->name]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function document(): ?array
    {
        if ($this->relationLoaded('stockTransaction') && $this->stockTransaction) {
            return ['kind' => 'stock_transaction', 'id' => $this->stockTransaction->id, 'number' => $this->stockTransaction->number];
        }

        if ($this->relationLoaded('stockOpnameItem') && $this->stockOpnameItem) {
            $opname = $this->stockOpnameItem->stockOpname;

            return ['kind' => 'stock_opname', 'id' => $opname->id, 'number' => $opname->number];
        }

        $source = $this->relationLoaded('reverses') && $this->reverses ? $this->reverses : $this->resource;
        $purchase = $source->relationLoaded('purchaseItem') ? $source->purchaseItem?->purchase : null;

        return $purchase ? ['kind' => 'purchase', 'id' => $purchase->id, 'number' => $purchase->number] : null;
    }
}
