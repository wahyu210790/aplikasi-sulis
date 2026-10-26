<?php

namespace App\Enums;

/** docs/desain-v2.md B4.1 */
enum MovementType: string
{
    case Opening = 'opening';
    case PurchaseIn = 'purchase_in';
    case ProjectOut = 'project_out';
    case ProjectReturn = 'project_return';
    case OpnameIn = 'opname_in';
    case OpnameOut = 'opname_out';
    case Reversal = 'reversal';

    public function label(): string
    {
        return match ($this) {
            self::Opening => 'Stok Awal',
            self::PurchaseIn => 'Pembelian Masuk',
            self::ProjectOut => 'Keluar ke Proyek',
            self::ProjectReturn => 'Pengembalian',
            self::OpnameIn => 'Koreksi Opname +',
            self::OpnameOut => 'Koreksi Opname −',
            self::Reversal => 'Pembatalan',
        };
    }

    /** Types that can be reversed (B4.4): not opening, not opname, not a reversal. */
    public function isReversible(): bool
    {
        return in_array($this, [self::PurchaseIn, self::ProjectOut, self::ProjectReturn], true);
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
