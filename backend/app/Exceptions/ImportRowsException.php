<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Thrown by an importer when one or more rows are invalid (docs/desain-v2.md B5.7).
 * Nothing has been saved. The controller turns it into HTTP 422:
 * {"message": "...", "errors": [{"row", "column", "message"}], "error_count": N}
 */
class ImportRowsException extends RuntimeException
{
    /** @param list<array{row: int, column: string, message: string}> $errors (max 100) */
    public function __construct(public readonly array $errors, public readonly int $errorCount)
    {
        parent::__construct("Ada {$errorCount} kesalahan di file. Tidak ada data yang disimpan. Perbaiki file lalu unggah lagi.");
    }
}
