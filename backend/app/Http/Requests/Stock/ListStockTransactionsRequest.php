<?php

namespace App\Http\Requests\Stock;

use App\Enums\StockTransactionStatus;
use App\Enums\StockTransactionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ListStockTransactionsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'type' => ['nullable', Rule::enum(StockTransactionType::class)],
            'status' => ['nullable', Rule::enum(StockTransactionStatus::class)],
            'project_id' => ['nullable', 'integer'],
            'product_id' => ['nullable', 'integer'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', ...($this->filled('date_from') ? ['after_or_equal:date_from'] : [])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
