<?php

namespace App\Http\Requests\Audit;

use Illuminate\Foundation\Http\FormRequest;

/**
 * GET /audit-logs (docs/desain-v2.md B8). Owner only.
 * action: a group ("opname") or one exact action ("opname.posted").
 */
class ListAuditLogsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'action' => ['nullable', 'string', 'max:60', 'regex:/^[a-z_]+(\.[a-z_]+)?$/'],
            'subject_type' => ['nullable', 'string', 'max:60', 'regex:/^[a-z_]+$/'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d', ...($this->filled('date_from') ? ['after_or_equal:date_from'] : [])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function attributes(): array
    {
        return ['user_id' => 'pengguna', 'action' => 'jenis aktivitas', 'subject_type' => 'jenis data'];
    }
}
