<?php

namespace App\Enums;

/** docs/desain-v2.md B3.12 */
enum StockTransactionStatus: string
{
    case Posted = 'posted';
    case Reversed = 'reversed';

    public function label(): string
    {
        return match ($this) {
            self::Posted => 'Tercatat',
            self::Reversed => 'Dibatalkan',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $status) => $status->value, self::cases());
    }
}
