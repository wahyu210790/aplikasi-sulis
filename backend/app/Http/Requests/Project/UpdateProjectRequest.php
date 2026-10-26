<?php

namespace App\Http\Requests\Project;

use App\Enums\ProjectStatus;
use App\Rules\UniqueInsensitive;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => mb_strtoupper(trim((string) $this->input('code'))),
            'name' => trim((string) $this->input('name')),
            'contract_value' => $this->filled('contract_value') ? $this->input('contract_value') : 0,
        ]);
    }

    public function rules(): array
    {
        return [
            'code' => ['required', 'string', 'max:30', 'regex:/^[A-Z0-9\-\._\/]+$/', new UniqueInsensitive('projects', 'code', $this->route('project')->id)],
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'client_name' => ['nullable', 'string', 'max:150'],
            'location' => ['nullable', 'string', 'max:200'],
            'contract_value' => ['required', 'integer', 'min:0', 'max:999999999999'],
            'start_date' => ['nullable', 'date_format:Y-m-d'],
            'end_date' => ['nullable', 'date_format:Y-m-d', ...($this->filled('start_date') ? ['after_or_equal:start_date'] : [])],
            'status' => ['required', Rule::enum(ProjectStatus::class)],
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
