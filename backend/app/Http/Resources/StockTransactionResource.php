<?php

namespace App\Http\Resources;

use App\Models\StockMovement;
use App\Models\StockTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Stock-out / return document (docs/desain-v2.md B9.3). value and total_value are money: ABSENT for Gudang (B7).
 * Lines are the document's own movements (no reversal rows); qty and value are shown as positive numbers.
 * Load 'project', 'creator', 'reverser' and 'lines.product.unit' (show) or withCount('lines') + withSum (list).
 *
 * @mixin StockTransaction
 */
class StockTransactionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $seeMoney = $request->user()->canSeeMoney();
        $person = fn ($user) => $user ? ['id' => $user->id, 'name' => $user->name] : null;

        return [
            'id' => $this->id,
            'number' => $this->number,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'project' => ['id' => $this->project->id, 'code' => $this->project->code, 'name' => $this->project->name],
            'person_name' => $this->person_name,
            'transaction_date' => $this->transaction_date->toDateString(),
            'notes' => $this->notes,
            'created_by' => $person($this->creator),
            'created_at' => $this->created_at?->toIso8601String(),
            'reversed_by' => $person($this->reverser),
            'reversed_at' => $this->reversed_at?->toIso8601String(),
            'reverse_reason' => $this->reverse_reason,
            'lines_count' => $this->whenCounted('lines'),
            'lines' => $this->whenLoaded('lines', fn () => $this->lines->map(fn (StockMovement $line) => [
                'id' => $line->id,
                'product' => [
                    'id' => $line->product->id,
                    'sku' => $line->product->sku,
                    'name' => $line->product->name,
                    'unit_symbol' => $line->product->unit->symbol,
                ],
                'qty' => ltrim($line->qty_change, '-'),
                'value' => $this->when($seeMoney, fn () => abs($line->value_change)),
            ])->all()),
            'total_value' => $this->when($seeMoney, fn () => abs((int) ($this->relationLoaded('lines')
                ? $this->lines->sum('value_change')
                : $this->lines_sum_value_change))),
        ];
    }
}
