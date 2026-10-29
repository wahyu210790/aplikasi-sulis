<?php

namespace App\Http\Requests\Opname;

use App\Support\StockRules;
use Illuminate\Foundation\Http\FormRequest;

/** POST /stock-opnames (docs/desain-v2.md B5.5, B10). */
class StoreStockOpnameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'opname_date' => StockRules::businessDate(),
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function attributes(): array
    {
        return ['opname_date' => 'tanggal opname'];
    }
}
