<?php

namespace App\Http\Requests\Stock;

use App\Enums\ProjectStatus;
use App\Support\StockRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /stock-outs (docs/desain-v2.md B5.2, B10). */
class StoreStockOutRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return list<ProjectStatus> project statuses this document may use */
    protected function allowedProjectStatuses(): array
    {
        return [ProjectStatus::Aktif];
    }

    protected function projectMessage(): string
    {
        return 'Proyek tidak ditemukan atau tidak berstatus Aktif.';
    }

    protected function prepareForValidation(): void
    {
        $notes = trim((string) $this->input('notes'));
        $this->merge([
            'person_name' => trim((string) $this->input('person_name')),
            'notes' => $notes === '' ? null : $notes,
        ]);
    }

    public function rules(): array
    {
        $statuses = array_map(fn (ProjectStatus $status) => $status->value, $this->allowedProjectStatuses());

        return [
            'project_id' => ['required', 'integer', Rule::exists('projects', 'id')->whereIn('status', $statuses)],
            'person_name' => ['required', 'string', 'min:2', 'max:100'],
            'transaction_date' => StockRules::businessDate(),
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => StockRules::items(),
            'items.*.product_id' => StockRules::activeProduct(),
            'items.*.qty' => StockRules::qty(),
        ];
    }

    public function messages(): array
    {
        return [
            ...StockRules::messages(),
            'project_id.exists' => $this->projectMessage(),
        ];
    }
}
