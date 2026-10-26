<?php

namespace App\Enums;

/** docs/desain-v2.md B3.12 */
enum StockTransactionType: string
{
    case ProjectOut = 'project_out';
    case ProjectReturn = 'project_return';

    public function label(): string
    {
        return match ($this) {
            self::ProjectOut => 'Barang Keluar',
            self::ProjectReturn => 'Pengembalian',
        };
    }

    /** Document number prefix: BK-000012 / RT-000013. */
    public function prefix(): string
    {
        return match ($this) {
            self::ProjectOut => 'BK',
            self::ProjectReturn => 'RT',
        };
    }

    public function movementType(): MovementType
    {
        return match ($this) {
            self::ProjectOut => MovementType::ProjectOut,
            self::ProjectReturn => MovementType::ProjectReturn,
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $type) => $type->value, self::cases());
    }
}
