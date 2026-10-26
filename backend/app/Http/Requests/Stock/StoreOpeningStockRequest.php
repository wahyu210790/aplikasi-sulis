<?php

namespace App\Http\Requests\Stock;

use App\Support\StockRules;
use Illuminate\Foundation\Http\FormRequest;

/** POST /opening-stocks (docs/desain-v2.md B5.6). */
class StoreOpeningStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'movement_date' => StockRules::businessDate(),
            'items' => StockRules::items(),
            'items.*.product_id' => StockRules::activeProduct(),
            'items.*.qty' => StockRules::qty(),
            'items.*.unit_cost' => StockRules::rupiah(),
        ];
    }

    public function messages(): array
    {
        return StockRules::messages();
    }
}
