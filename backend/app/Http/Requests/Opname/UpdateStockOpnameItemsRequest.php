<?php

namespace App\Http\Requests\Opname;

use App\Support\StockRules;
use Illuminate\Foundation\Http\FormRequest;

/**
 * PUT /stock-opnames/{id}/items (docs/desain-v2.md B5.5): replaces the whole item list of a draft.
 * Inactive products are allowed (B10 "active (except opname)"). counted_qty may be empty while counting
 * and may be 0 (nothing found); it must be filled before submit.
 */
class UpdateStockOpnameItemsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'items' => StockRules::items(),
            'items.*.product_id' => ['required', 'integer', 'distinct', 'exists:products,id'],
            'items.*.counted_qty' => ['nullable', 'regex:'.StockRules::QTY_REGEX],
            'items.*.notes' => ['nullable', 'string', 'max:300'],
        ];
    }

    public function messages(): array
    {
        return [
            ...StockRules::messages(),
            'items.*.product_id.exists' => 'Barang tidak ditemukan.',
            'items.*.counted_qty.regex' => 'Hasil hitung harus berupa angka 0 atau lebih, maksimal 3 angka di belakang koma.',
        ];
    }

    public function attributes(): array
    {
        return ['items.*.counted_qty' => 'hasil hitung', 'items.*.notes' => 'catatan barang'];
    }
}
