<?php

namespace App\Support;

use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Excel export of a report (docs/desain-v2.md T6.01): the first row is the header (bold), money cells are
 * integer rupiah, quantities are numbers. The file name gets today's date, e.g. "laba-proyek-2026-10-30.xlsx".
 * Exports only read data: no audit entry is written.
 */
final class ReportExport
{
    public const MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    /** Most rows one export may contain; more → 422 with a hint to narrow the filters. */
    public const MAX_ROWS = 10000;

    /** @param  list<list<string|int|float|null>>  $rows */
    public static function download(array $rows, string $name): BinaryFileResponse
    {
        $file = $name.'-'.now()->format('Y-m-d').'.xlsx';

        return response()
            ->download(Xlsx::write($rows), $file, ['Content-Type' => self::MIME])
            ->deleteFileAfterSend();
    }

    /**
     * A decimal string from the database ("12.500", "11500.0000") as a number cell for Excel.
     * Only for writing the cell: never use the result for further calculations (B2: use Dec).
     */
    public static function number(?string $value): int|float|null
    {
        if ($value === null || $value === '') {
            return null;
        }
        $number = (float) $value;

        return floor($number) === $number ? (int) $number : $number;
    }
}
