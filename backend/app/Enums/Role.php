<?php

namespace App\Enums;

enum Role: string
{
    case Owner = 'owner';
    case Gudang = 'gudang';
    case Finance = 'finance';

    public function label(): string
    {
        return match ($this) {
            self::Owner => 'Owner',
            self::Gudang => 'Gudang',
            self::Finance => 'Finance',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_map(fn (self $role) => $role->value, self::cases());
    }
}
