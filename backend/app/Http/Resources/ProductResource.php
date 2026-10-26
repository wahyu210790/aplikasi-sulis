<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * docs/desain-v2.md B9.3. Money keys (avg_cost, stock_value, has_cost) are ABSENT for Gudang (B7).
 *
 * @mixin Product
 */
class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $seeMoney = $request->user()->canSeeMoney();
        $balance = $this->stockBalance;

        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'name' => $this->name,
            'category' => ['id' => $this->category->id, 'name' => $this->category->name],
            'unit' => ['id' => $this->unit->id, 'name' => $this->unit->name, 'symbol' => $this->unit->symbol],
            'min_stock' => $this->min_stock,
            'notes' => $this->notes,
            'is_active' => $this->is_active,
            'stock' => [
                'qty' => $balance?->qty ?? '0.000',
                'avg_cost' => $this->when($seeMoney, fn () => $balance?->avg_cost ?? '0.0000'),
                'stock_value' => $this->when($seeMoney, fn () => $balance?->stock_value ?? 0),
                'has_cost' => $this->when($seeMoney, fn () => $balance?->has_cost ?? false),
            ],
            'is_low_stock' => $this->isLowStock(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
