<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One row of GET /reports/stock-value (docs/desain-v2.md B9.2): qty, average cost and stock value of a product.
 * The route is Owner/Finance only; money keys are still wrapped (B7). Load 'category', 'unit', 'stockBalance'.
 *
 * @mixin Product
 */
class StockValueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $seeMoney = $request->user()->canSeeMoney();
        $balance = $this->stockBalance;

        return [
            'product' => [
                'id' => $this->id,
                'sku' => $this->sku,
                'name' => $this->name,
                'category_name' => $this->category->name,
                'unit_symbol' => $this->unit->symbol,
                'is_active' => $this->is_active,
            ],
            'qty' => $balance->qty,
            'avg_cost' => $this->when($seeMoney, fn () => $balance->avg_cost),
            'stock_value' => $this->when($seeMoney, fn () => $balance->stock_value),
            'has_cost' => $this->when($seeMoney, fn () => $balance->has_cost),
        ];
    }
}
