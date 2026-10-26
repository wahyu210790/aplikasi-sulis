<?php

namespace App\Http\Requests\ProjectCost;

use App\Support\StockRules;
use Illuminate\Foundation\Http\FormRequest;

/** POST /projects/{project}/costs (docs/desain-v2.md B3.9, B10: amount > 0, cost_date is a business date). */
class StoreProjectCostRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['description' => trim((string) $this->input('description'))]);
    }

    public function rules(): array
    {
        return [
            'cost_date' => StockRules::businessDate(),
            'description' => ['required', 'string', 'max:200'],
            'amount' => ['required', 'integer', 'min:1', 'max:'.StockRules::MAX_RUPIAH],
        ];
    }

    public function messages(): array
    {
        return [
            'amount.min' => 'Jumlah biaya harus lebih dari 0.',
        ];
    }
}
