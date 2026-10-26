<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\StockTransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StoreStockOutRequest;
use App\Services\StockDocumentService;
use Illuminate\Http\JsonResponse;

/** Barang Keluar (docs/desain-v2.md B5.2). Gudang and Owner. */
class StockOutController extends Controller
{
    public function store(StoreStockOutRequest $request, StockDocumentService $documents): JsonResponse
    {
        $document = $documents->create(StockTransactionType::ProjectOut, $request->validated(), $request->user());

        return StockTransactionController::respond($request, $document, 201);
    }
}
