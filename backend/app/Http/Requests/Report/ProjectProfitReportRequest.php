<?php

namespace App\Http\Requests\Report;

use App\Enums\ProjectStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** GET /reports/project-profit (docs/desain-v2.md B9.2): optional status filter. */
class ProjectProfitReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(ProjectStatus::class)],
        ];
    }
}
