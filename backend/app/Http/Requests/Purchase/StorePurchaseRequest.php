<?php

namespace App\Http\Requests\Purchase;

use App\Support\StockRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** POST /purchases and PUT /purchases/{purchase} (docs/desain-v2.md B5.1, B10). */
class StorePurchaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $invoice = trim((string) $this->input('invoice_no'));
        $this->merge(['invoice_no' => $invoice === '' ? null : $invoice]);
    }

    public function rules(): array
    {
        return [
            'supplier_id' => ['required', 'integer', Rule::exists('suppliers', 'id')->where('is_active', true)],
            'purchase_date' => StockRules::businessDate(),
            'invoice_no' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => StockRules::items(),
            'items.*.product_id' => StockRules::activeProduct(),
            'items.*.qty' => StockRules::qty(),
            'items.*.unit_price' => StockRules::rupiah(),
        ];
    }

    public function messages(): array
    {
        return [
            ...StockRules::messages(),
            'supplier_id.exists' => 'Pemasok tidak ditemukan atau sudah nonaktif.',
        ];
    }
}
