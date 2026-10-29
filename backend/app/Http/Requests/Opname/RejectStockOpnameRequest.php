<?php

namespace App\Http\Requests\Opname;

use Illuminate\Foundation\Http\FormRequest;

/** POST /stock-opnames/{id}/reject (docs/desain-v2.md B5.5): the Owner sends the opname back to draft with a note. */
class RejectStockOpnameRequest extends FormRequest
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
