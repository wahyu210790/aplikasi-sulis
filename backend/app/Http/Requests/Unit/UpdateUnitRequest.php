<?php

namespace App\Http\Requests\Unit;

use App\Rules\UniqueInsensitive;
use Illuminate\Foundation\Http\FormRequest;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'symbol' => trim((string) $this->input('symbol')),
        ]);
    }

    public function rules(): array
    {
        $id = $this->route('unit')->id;

        return [
            'name' => ['required', 'string', 'max:50', new UniqueInsensitive('units', 'name', $id)],
            'symbol' => ['required', 'string', 'max:20', new UniqueInsensitive('units', 'symbol', $id)],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
