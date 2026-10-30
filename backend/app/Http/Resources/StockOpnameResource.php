<?php

namespace App\Http\Resources;

use App\Enums\OpnameStatus;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Stock opname (docs/desain-v2.md B3.14, B3.15, B5.5). Quantities only: there is NO money key here, for any role (B7 "opname items: none").
 * The rupiah effect of a posted opname is only in the ledger (opname_in / opname_out movements), hidden from Gudang there.
 * Load 'creator', 'submitter', 'poster', 'canceller', 'rejecter', 'items.product.unit' and 'items.product.stockBalance' (show)
 * or withCount('items') (list).
 * QA bug #4: while the opname is still open (draft / menunggu_persetujuan) system_qty is TODAY's stock (stock_balances),
 * not the value saved when the items were last saved. Approval recomputes it under lock anyway (B5.5).
 * After approval (selesai) or cancel (batal) the saved system_qty and diff_qty are shown.
 *
 * @mixin StockOpname
 */
class StockOpnameResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $person = fn ($user) => $user ? ['id' => $user->id, 'name' => $user->name] : null;
        $open = in_array($this->status, [OpnameStatus::Draft, OpnameStatus::MenungguPersetujuan], true);

        return [
            'id' => $this->id,
            'number' => $this->number,
            'opname_date' => $this->opname_date->toDateString(),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'notes' => $this->notes,
            'created_by' => $person($this->creator),
            'created_at' => $this->created_at?->toIso8601String(),
            'submitted_by' => $person($this->submitter),
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'posted_by' => $person($this->poster),
            'posted_at' => $this->posted_at?->toIso8601String(),
            'cancelled_by' => $person($this->canceller),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'rejected_by' => $person($this->rejecter),
            'rejected_at' => $this->rejected_at?->toIso8601String(),
            'reject_reason' => $this->reject_reason,
            'items_count' => $this->whenCounted('items'),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn (StockOpnameItem $item) => [
                'id' => $item->id,
                'product' => [
                    'id' => $item->product->id,
                    'sku' => $item->product->sku,
                    'name' => $item->product->name,
                    'unit_symbol' => $item->product->unit->symbol,
                    'is_active' => $item->product->is_active,
                ],
                'system_qty' => $open ? $this->currentQty($item) : $item->system_qty,
                'counted_qty' => $item->counted_qty,
                'diff_qty' => $item->diff_qty,
                'notes' => $item->notes,
            ])->all()),
        ];
    }

    /** Today's stock of the item's product; the saved value if the balance was not loaded. */
    private function currentQty(StockOpnameItem $item): ?string
    {
        if (! $item->product->relationLoaded('stockBalance') || ! $item->product->stockBalance) {
            return $item->system_qty;
        }

        return $item->product->stockBalance->qty;
    }
}
