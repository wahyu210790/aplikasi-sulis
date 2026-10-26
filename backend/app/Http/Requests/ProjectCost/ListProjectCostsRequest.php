<?php

namespace App\Http\Requests\ProjectCost;

use Illuminate\Foundation\Http\FormRequest;

/** GET /projects/{project}/costs */
class ListProjectCostsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
