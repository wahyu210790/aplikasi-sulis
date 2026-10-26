<?php

namespace App\Http\Requests\Product;

use App\Rules\UniqueInsensitive;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'sku' => mb_strtoupper(trim((string) $this->input('sku'))),
            'name' => trim((string) $this->input('name')),
            'min_stock' => $this->filled('min_stock') ? $this->input('min_stock') : '0',
        ]);
    }

    public function rules(): array
    {
        return [
            'sku' => ['required', 'string', 'max:50', 'regex:/^[A-Z0-9\-\._\/]+$/', new UniqueInsensitive('products', 'sku')],
            'name' => ['required', 'string', 'min:2', 'max:150'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')->where('is_active', true)],
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')->where('is_active', true)],
            'min_stock' => ['required', 'numeric', 'regex:/^\d{1,12}(\.\d{1,3})?$/'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'category_id.exists' => 'Kategori tidak ditemukan atau sudah nonaktif.',
            'unit_id.exists' => 'Satuan tidak ditemukan atau sudah nonaktif.',
            'sku.regex' => 'SKU hanya boleh berisi huruf, angka, dan tanda - . _ /',
        ];
    }
}
