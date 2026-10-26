<?php

namespace App\Enums;

/** docs/desain-v2.md B3.10 */
enum PurchaseStatus: string
{
    case Draft = 'draft';
    case Diterima = 'diterima';
    case Batal = 'batal';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::Diterima => 'Diterima',
            self::Batal => 'Batal',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
