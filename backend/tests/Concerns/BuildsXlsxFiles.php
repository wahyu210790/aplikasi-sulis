<?php

namespace Tests\Concerns;

use App\Support\Xlsx;
use Illuminate\Http\UploadedFile;

/** Builds small .xlsx files inside the test (no binary fixture files in git). */
trait BuildsXlsxFiles
{
    /** @param list<list<string|int|float|null>> $rows first row = header */
    protected function xlsxUpload(array $rows, string $name = 'barang.xlsx'): UploadedFile
    {
        return new UploadedFile(Xlsx::write($rows), $name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', null, true);
    }
}
