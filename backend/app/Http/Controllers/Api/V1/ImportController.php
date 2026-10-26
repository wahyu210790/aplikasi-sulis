<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ImportRowsException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Import\ImportProductsRequest;
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
        $path = Xlsx::write(ProductImporter::templateRows());

        return response()
            ->download($path, 'template-impor-barang.xlsx', ['Content-Type' => self::XLSX_MIME])
            ->deleteFileAfterSend();
    }

    public function products(ImportProductsRequest $request, ProductImporter $importer): JsonResponse
    {
        $file = $request->file('file');

        try {
            $result = $importer->import($file->getRealPath(), $file->getClientOriginalName(), $request->user());
        } catch (ImportRowsException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors,
                'error_count' => $e->errorCount,
            ], 422);
        }

        return response()->json(['data' => $result]);
    }
}
