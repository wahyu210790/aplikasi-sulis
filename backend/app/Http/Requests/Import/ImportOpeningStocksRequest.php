<?php

namespace App\Http\Requests\Import;

use Illuminate\Foundation\Http\FormRequest;

class ImportOpeningStocksRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // B5.7: .xlsx, max 2 MB. The content is checked when the file is opened.
            'file' => ['required', 'file', 'extensions:xlsx', 'max:2048'],
        ];
    }
}
