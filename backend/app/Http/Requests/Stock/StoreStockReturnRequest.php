<?php

namespace App\Http\Requests\Stock;

use App\Enums\ProjectStatus;

/** POST /stock-returns (docs/desain-v2.md B5.3). Same body as a stock-out; person_name = who brings the goods back. */
class StoreStockReturnRequest extends StoreStockOutRequest
{
    protected function allowedProjectStatuses(): array
    {
        return [ProjectStatus::Aktif, ProjectStatus::Selesai];
    }

    protected function projectMessage(): string
    {
        return 'Proyek tidak ditemukan atau berstatus Batal.';
    }
}
