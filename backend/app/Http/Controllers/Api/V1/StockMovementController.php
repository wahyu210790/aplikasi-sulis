<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\BusinessRuleException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\ListMovementsRequest;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Models\StockMovement;
use App\Support\ApiPaginator;
use App\Support\ReportExport;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Ledger views (docs/desain-v2.md B9.2): one product's history and the movements report.
 * Everyone may read; Gudang gets no money keys (B7). Newest first (by id = the order they were written).
 * The movements report can also be downloaded as an Excel file (T6.01); Gudang's file has no money columns.
 */
class StockMovementController extends Controller
{
    public function product(ListMovementsRequest $request, Product $product): JsonResponse
    {
        return $this->list($request, StockMovement::query()->where('product_id', $product->id));
    }

    public function report(ListMovementsRequest $request): JsonResponse
    {
        return $this->list($request, $this->reportQuery($request));
    }

    /** GET /reports/movements/export — the same filters as the report, every matching row (max ReportExport::MAX_ROWS). */
    public function reportExport(ListMovementsRequest $request): BinaryFileResponse
    {
        $query = $this->filtered($request, $this->reportQuery($request));
        if ((clone $query)->count() > ReportExport::MAX_ROWS) {
            throw new BusinessRuleException('Data terlalu banyak untuk diunduh (lebih dari 10.000 baris). Persempit filter tanggal, barang atau proyek.');
        }

        $seeMoney = $request->user()->canSeeMoney();
        $header = ['Tanggal', 'Jenis', 'SKU', 'Nama Barang', 'Satuan', 'Perubahan', 'Stok Setelah', 'Dokumen', 'Proyek', 'Pengambil / Pengembali', 'Dicatat Oleh', 'Catatan'];
        if ($seeMoney) {
            array_push($header, 'Harga Satuan', 'Perubahan Nilai', 'Nilai Stok Setelah');
        }
        $rows = [$header];

        $query->with(StockMovementResource::RELATIONS)->orderBy('id', 'desc');
        foreach ($query->get() as $movement) {
            $item = (new StockMovementResource($movement))->toArray($request);
            $row = [
                $item['movement_date'], $item['type_label'], $item['product']['sku'], $item['product']['name'], $item['product']['unit_symbol'],
                ReportExport::number($item['qty_change']), ReportExport::number($item['qty_after']),
                $item['document']['number'] ?? '', $item['project'] ? $item['project']['code'].' — '.$item['project']['name'] : '',
                $item['person_name'] ?? '', $item['created_by']['name'] ?? '', $item['notes'] ?? '',
            ];
            if ($seeMoney) {
                array_push($row, ReportExport::number($item['unit_cost']), (int) $item['value_change'], (int) $item['value_after']);
            }
            $rows[] = $row;
        }

        return ReportExport::download($rows, 'pergerakan-barang');
    }

    private function reportQuery(ListMovementsRequest $request): Builder
    {
        $query = StockMovement::query();
        if ($productId = $request->validated('product_id')) {
            $query->where('product_id', $productId);
        }

        return $query;
    }

    private function list(ListMovementsRequest $request, Builder $query): JsonResponse
    {
        $query = $this->filtered($request, $query)->with(StockMovementResource::RELATIONS)->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), StockMovementResource::class, $request);
    }

    /** Filters shared by the product history, the report and the export: type, project, user, date range. */
    private function filtered(ListMovementsRequest $request, Builder $query): Builder
    {
        if ($type = $request->validated('type')) {
            $query->where('type', $type);
        }
        if ($projectId = $request->validated('project_id')) {
            $query->where('project_id', $projectId);
        }
        if ($userId = $request->validated('user_id')) {
            $query->where('created_by', $userId);
        }
        if ($from = $request->validated('date_from')) {
            $query->whereDate('movement_date', '>=', $from);
        }
        if ($to = $request->validated('date_to')) {
            $query->whereDate('movement_date', '<=', $to);
        }

        return $query;
    }
}
