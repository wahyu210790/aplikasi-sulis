<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ImportRowsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Import\ImportOpeningStocksRequest;
use App\Http\Requests\Import\ImportProductsRequest;
use App\Services\Import\OpeningStockImporter;
use App\Services\Import\ProductImporter;
use App\Support\Xlsx;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/** Excel import (docs/desain-v2.md B5.7). */
class ImportController extends Controller
{
    private const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    public function productTemplate(): BinaryFileResponse
    {
        return $this->download(ProductImporter::templateRows(), 'template-impor-barang.xlsx');
    }

    public function products(ImportProductsRequest $request, ProductImporter $importer): JsonResponse
    {
        $file = $request->file('file');

        try {
            $result = $importer->import($file->getRealPath(), $file->getClientOriginalName(), $request->user());
        } catch (ImportRowsException $e) {
            return $this->rowErrors($e);
        }

        return response()->json(['data' => $result]);
    }

    public function openingStockTemplate(): BinaryFileResponse
    {
        return $this->download(OpeningStockImporter::templateRows(), 'template-stok-awal.xlsx');
    }

    public function openingStocks(ImportOpeningStocksRequest $request, OpeningStockImporter $importer): JsonResponse
    {
        $file = $request->file('file');

        try {
            $result = $importer->import($file->getRealPath(), $file->getClientOriginalName(), $request->user());
        } catch (ImportRowsException $e) {
            return $this->rowErrors($e);
        }

        return response()->json(['data' => $result]);
    }

    private function download(array $rows, string $name): BinaryFileResponse
    {
        return response()
            ->download(Xlsx::write($rows), $name, ['Content-Type' => self::XLSX_MIME])
            ->deleteFileAfterSend();
    }

    private function rowErrors(ImportRowsException $e): JsonResponse
    {
        return response()->json([
            'message' => $e->getMessage(),
            'errors' => $e->errors,
            'error_count' => $e->errorCount,
        ], 422);
    }
}
