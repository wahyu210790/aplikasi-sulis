<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Exact decimal math for quantities and money (wraps bcmath).
 * NEVER use PHP floats for qty or money. All inputs/outputs are numeric strings.
 */
final class Dec
{
    public const SCALE = 6;

    public static function add(string $a, string $b, int $scale = self::SCALE): string
    {
        return bcadd(self::n($a), self::n($b), $scale);
    }

    public static function sub(string $a, string $b, int $scale = self::SCALE): string
    {
        return bcsub(self::n($a), self::n($b), $scale);
    }

    public static function mul(string $a, string $b, int $scale = self::SCALE): string
    {
        return bcmul(self::n($a), self::n($b), $scale);
    }

    public static function div(string $a, string $b, int $scale = self::SCALE): string
    {
        if (bccomp(self::n($b), '0', self::SCALE) === 0) {
            throw new InvalidArgumentException('Division by zero.');
        }

        return bcdiv(self::n($a), self::n($b), $scale);
    }

    /** Returns -1, 0 or 1. */
    public static function cmp(string $a, string $b): int
    {
        return bccomp(self::n($a), self::n($b), self::SCALE);
    }

    public static function isZero(string $a): bool
    {
        return self::cmp($a, '0') === 0;
    }

    /** Round half away from zero to an integer rupiah. "1000.5" => 1001, "-1000.5" => -1001, "1000.49" => 1000. */
    public static function roundRupiah(string $a): int
    {
        $a = self::n($a);

        $rounded = bccomp($a, '0', self::SCALE) >= 0
            ? bcadd($a, '0.5', 0)
            : bcsub($a, '0.5', 0);

        return (int) $rounded;
    }

    /** Normalise a quantity to exactly 3 decimals (truncating beyond 3): "12.5" => "12.500". */
    public static function qty(string $a): string
    {
        return bcadd(self::n($a), '0', 3);
    }

    private static function n(string $a): string
    {
        $a = trim($a);
        if (! preg_match('/^-?\d+(\.\d+)?$/', $a)) {
            throw new InvalidArgumentException("Invalid decimal: {$a}");
        }

        return $a;
    }
}
