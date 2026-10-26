<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * One product a project still holds (docs/desain-v2.md B5.3): ['product' => Product, 'qty' => '4.000', 'value' => 40000].
 * value is money: ABSENT for Gudang (B7).
 */
class IssuedItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $product = $this->resource['product'];

        return [
            'product' => [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'unit_symbol' => $product->unit->symbol,
                'is_active' => $product->is_active,
            ],
            'qty' => $this->resource['qty'],
            'value' => $this->when($request->user()->canSeeMoney(), fn () => $this->resource['value']),
        ];
    }
}
