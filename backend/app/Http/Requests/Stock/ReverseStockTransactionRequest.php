<?php

namespace App\Http\Requests\Stock;

use Illuminate\Foundation\Http\FormRequest;

/** POST /stock-transactions/{id}/reverse (docs/desain-v2.md B5.4). */
class ReverseStockTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => ['required', 'string', 'min:5', 'max:300'],
        ];
    }
}
