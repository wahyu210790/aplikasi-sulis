<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Business dates (docs/desain-v2.md B10, decision H8): not after today and at most 30 days back.
 * Use together with 'date_format:Y-m-d'. Today = Asia/Jakarta (config/app.php timezone).
 */
class BusinessDate implements ValidationRule
{
    public const DAYS_BACK = 30;

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            return; // date_format reports this
        }
        $problem = self::problem($value);
        if ($problem !== null) {
            $fail(':Attribute '.$problem);
        }
    }

    /** null when the Y-m-d date is inside the window, otherwise the end of an Indonesian sentence. */
    public static function problem(string $date): ?string
    {
        if ($date > now()->toDateString()) {
            return 'tidak boleh melewati hari ini.';
        }
        $earliest = now()->subDays(self::DAYS_BACK)->startOfDay();
        if ($date < $earliest->toDateString()) {
            return 'paling lama '.self::DAYS_BACK.' hari ke belakang (paling awal '.$earliest->format('d-m-Y').').';
        }

        return null;
    }
}
