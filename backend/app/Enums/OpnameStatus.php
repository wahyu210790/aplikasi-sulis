<?php

namespace App\Enums;

/** docs/desain-v2.md B3.14. draft -> menunggu_persetujuan -> selesai; reject goes back to draft; batal from draft or menunggu_persetujuan. */
enum OpnameStatus: string
{
    case Draft = 'draft';
    case MenungguPersetujuan = 'menunggu_persetujuan';
    case Selesai = 'selesai';
    case Batal = 'batal';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Draft',
            self::MenungguPersetujuan => 'Menunggu Persetujuan',
            self::Selesai => 'Selesai',
            self::Batal => 'Batal',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
