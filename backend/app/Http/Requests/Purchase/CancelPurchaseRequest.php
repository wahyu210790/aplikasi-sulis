<?php

namespace App\Http\Requests\Purchase;

use Illuminate\Foundation\Http\FormRequest;

/** POST /purchases/{purchase}/cancel (docs/desain-v2.md B5.1 step 4). */
class CancelPurchaseRequest extends FormRequest
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
