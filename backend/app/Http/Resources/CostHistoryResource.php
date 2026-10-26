<?php

namespace App\Http\Resources;

use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One row of the cost-price history (docs/desain-v2.md B9.2): an opening or purchase_in movement
 * with the price paid (unit_cost) and the average cost right after it (avg_cost_after).
 * reversed = true when the movement was cancelled later (the cancelled purchase is still shown).
 * Owner/Finance only; money keys are still wrapped (B7). Load CostHistoryResource::RELATIONS and withExists('reversedBy as reversed').
 *
 * @mixin StockMovement
 */
class CostHistoryResource extends JsonResource
{
    public const RELATIONS = ['product.unit', 'purchaseItem.purchase.supplier'];

    public function toArray(Request $request): array
    {
        $seeMoney = $request->user()->canSeeMoney();
        $purchase = $this->purchaseItem?->purchase;

        return [
            'id' => $this->id,
            'movement_date' => $this->movement_date->toDateString(),
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'product' => [
                'id' => $this->product->id,
                'sku' => $this->product->sku,
                'name' => $this->product->name,
                'unit_symbol' => $this->product->unit->symbol,
            ],
            'qty' => $this->qty_change,
            'unit_cost' => $this->when($seeMoney, fn () => $this->unit_cost),
            'avg_cost_after' => $this->when($seeMoney, fn () => $this->avg_cost_after),
            'purchase' => $purchase ? ['id' => $purchase->id, 'number' => $purchase->number] : null,
            'supplier' => $purchase?->supplier ? ['id' => $purchase->supplier->id, 'name' => $purchase->supplier->name] : null,
            'reversed' => (bool) $this->reversed,
        ];
    }
}
