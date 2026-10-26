<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;

/**
 * Case-insensitive "unique" check ("Kabel" and "kabel" count as the same name).
 * Needed because SQLite (tests) compares case-sensitively but MySQL (production) does not.
 * Usage: new UniqueInsensitive('categories', 'name', $ignoreId)
 */
class UniqueInsensitive implements ValidationRule
{
    public function __construct(
        private readonly string $table,
        private readonly string $column,
        private readonly ?int $ignoreId = null,
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }

        $exists = DB::table($this->table)
            ->whereRaw('LOWER('.$this->column.') = ?', [mb_strtolower($value)])
            ->when($this->ignoreId !== null, fn ($query) => $query->where('id', '!=', $this->ignoreId))
            ->exists();

        if ($exists) {
            $fail('validation.unique')->translate();
        }
    }
}
