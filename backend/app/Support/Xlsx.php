<?php

namespace App\Support;

use App\Exceptions\BusinessRuleException;
use DateTimeInterface;
use OpenSpout\Common\Entity\Row;
use OpenSpout\Common\Entity\Style\Style;
use OpenSpout\Reader\XLSX\Options;
use OpenSpout\Reader\XLSX\Reader;
use OpenSpout\Writer\XLSX\Writer;
use Throwable;

/**
 * Small helper around openspout for .xlsx import/export (docs/desain-v2.md B5.7).
 * Every cell is returned as a trimmed string ('' when empty).
 */
final class Xlsx
{
    /**
     * Read the FIRST sheet. Keys are Excel row numbers (1 = header row), empty rows are kept as [].
     *
     * @return array<int, list<string>>
     */
    public static function readFirstSheet(string $path): array
    {
        $options = new Options;
        $options->SHOULD_PRESERVE_EMPTY_ROWS = true;
        $reader = new Reader($options);

        try {
            $reader->open($path);
            $rows = [];
            foreach ($reader->getSheetIterator() as $sheet) {
                $number = 0;
                foreach ($sheet->getRowIterator() as $row) {
                    $number++;
                    $rows[$number] = array_map(fn ($cell) => self::cellToString($cell->getValue()), $row->getCells());
                }
                break; // first sheet only
            }
            $reader->close();
        } catch (Throwable) {
            throw new BusinessRuleException('File tidak bisa dibaca. Pastikan file berformat .xlsx (Excel).');
        }

        return $rows;
    }

    /**
     * Write rows to a new .xlsx file and return its path. The first row is written in bold.
     *
     * @param  list<list<string|int|float|null>>  $rows
     */
    public static function write(array $rows): string
    {
        $base = tempnam(sys_get_temp_dir(), 'xlsx');
        unlink($base);
        $path = $base.'.xlsx';
        $writer = new Writer;
        $writer->openToFile($path);
        foreach ($rows as $index => $values) {
            $writer->addRow(Row::fromValues($values, $index === 0 ? (new Style)->setFontBold() : null));
        }
        $writer->close();

        return $path;
    }

    public static function cellToString(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d');
        }
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        if (is_float($value)) {
            $text = number_format($value, 3, '.', '');

            return rtrim(rtrim($text, '0'), '.');
        }

        return trim((string) $value);
    }
}
