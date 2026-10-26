<?php

namespace App\Http\Requests\Report;

use Illuminate\Foundation\Http\FormRequest;

/** GET /reports/stock-value (docs/desain-v2.md B9.2). */
class StockValueReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
            'is_active' => ['nullable', 'in:0,1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
