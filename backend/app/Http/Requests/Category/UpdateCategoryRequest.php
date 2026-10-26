<?php

namespace App\Http\Requests\Category;

use App\Rules\UniqueInsensitive;
use Illuminate\Foundation\Http\FormRequest;

class UpdateCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['name' => trim((string) $this->input('name'))]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:100', new UniqueInsensitive('categories', 'name', $this->route('category')->id)],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
