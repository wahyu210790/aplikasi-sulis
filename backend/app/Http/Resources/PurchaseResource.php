<?php

namespace App\Http\Resources;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * total_value, unit_price and line_total are money: the keys are ABSENT for Gudang (B7).
 * Supplier is only {id, name} for everyone.
 *
 * @mixin Purchase
 */
class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $seeMoney = $request->user()->canSeeMoney();
        $person = fn ($user) => $user ? ['id' => $user->id, 'name' => $user->name] : null;

        return [
            'id' => $this->id,
            'number' => $this->number,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'supplier' => ['id' => $this->supplier->id, 'name' => $this->supplier->name],
            'purchase_date' => $this->purchase_date->toDateString(),
            'invoice_no' => $this->invoice_no,
            'notes' => $this->notes,
            'total_value' => $this->when($seeMoney, fn () => $this->total_value),
            'items_count' => $this->whenCounted('items'),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (PurchaseItem $item) => [
                'id' => $item->id,
                'product' => [
                    'id' => $item->product->id,
                    'sku' => $item->product->sku,
                    'name' => $item->product->name,
                    'unit_symbol' => $item->product->unit->symbol,
                    'is_active' => $item->product->is_active,
                ],
                'qty' => $item->qty,
                'unit_price' => $this->when($seeMoney, fn () => $item->unit_price),
                'line_total' => $this->when($seeMoney, fn () => $item->line_total),
            ])->all()),
            'created_by' => $person($this->creator),
            'received_by' => $person($this->receiver),
            'received_at' => $this->received_at?->toIso8601String(),
            'cancelled_by' => $person($this->canceller),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'cancel_reason' => $this->cancel_reason,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
