<?php

namespace App\Http\Requests\Project;

use App\Rules\UniqueInsensitive;
use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $code = mb_strtoupper(trim((string) $this->input('code')));

        $this->merge([
            'code' => $code === '' ? null : $code,
            'name' => trim((string) $this->input('name')),
            'contract_value' => $this->filled('contract_value') ? $this->input('contract_value') : 0,
        ]);
    }

    public function rules(): array
    {
        return [
            // Empty code -> the server makes one: PRJ-0001, PRJ-0002, ...
            'code' => ['nullable', 'string', 'max:30', 'regex:/^[A-Z0-9\-\._\/]+$/', new UniqueInsensitive('projects', 'code')],
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'client_name' => ['nullable', 'string', 'max:150'],
            'location' => ['nullable', 'string', 'max:200'],
            'contract_value' => ['required', 'integer', 'min:0', 'max:999999999999'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', ...($this->filled('start_date') ? ['after_or_equal:start_date'] : [])],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'Kode hanya boleh berisi huruf, angka, dan tanda - . _ /',
        ];
    }
}
