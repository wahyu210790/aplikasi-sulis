<?php

namespace App\Support;

use App\Rules\BusinessDate;
use Illuminate\Validation\Rule;

/** Shared validation rules for stock documents (docs/desain-v2.md B10). */
final class StockRules
{
    public const QTY_REGEX = '/^\d{1,12}(\.\d{1,3})?$/';

    public const MAX_ITEMS = 50;

    public const MAX_RUPIAH = 999999999999;

    /** @return list<mixed> */
    public static function businessDate(): array
    {
        return ['required', 'date_format:Y-m-d', new BusinessDate];
    }

    /** @return list<mixed> */
    public static function items(): array
    {
        return ['required', 'array', 'min:1', 'max:'.self::MAX_ITEMS];
    }

    /** @return list<mixed> an active product, each product only once in the list */
    public static function activeProduct(): array
    {
        return ['required', 'integer', 'distinct', Rule::exists('products', 'id')->where('is_active', true)];
    }

    /** @return list<string> qty > 0 with at most 3 decimals */
    public static function qty(): array
    {
        return ['required', 'regex:'.self::QTY_REGEX, 'not_regex:/^0+(\.0+)?$/'];
    }

    /** @return list<string> whole rupiah 0..999.999.999.999 */
    public static function rupiah(): array
    {
        return ['required', 'integer', 'min:0', 'max:'.self::MAX_RUPIAH];
    }

    /** Messages for items.*.product_id and items.*.qty. */
    public static function messages(): array
    {
        return [
            'items.required' => 'Tambahkan minimal 1 barang.',
            'items.min' => 'Tambahkan minimal 1 barang.',
            'items.max' => 'Maksimal '.self::MAX_ITEMS.' barang per dokumen.',
            'items.*.product_id.exists' => 'Barang tidak ditemukan atau sudah nonaktif.',
            'items.*.product_id.distinct' => 'Barang yang sama tidak boleh dipilih dua kali.',
            'items.*.qty.regex' => 'Jumlah harus berupa angka, maksimal 3 angka di belakang koma.',
            'items.*.qty.not_regex' => 'Jumlah harus lebih dari 0.',
        ];
    }
}
