<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\StockTransactionType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StoreStockReturnRequest;
use App\Http\Resources\IssuedItemResource;
use App\Models\Product;
use App\Models\Project;
use App\Services\StockDocumentService;
use App\Services\StockLedger;
use App\Support\Dec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Pengembalian (docs/desain-v2.md B5.3). Returns are valued at the project's own issue cost (B4.3). */
class StockReturnController extends Controller
{
    public function store(StoreStockReturnRequest $request, StockDocumentService $documents): JsonResponse
    {
        $document = $documents->create(StockTransactionType::ProjectReturn, $request->validated(), $request->user());

        return StockTransactionController::respond($request, $document, 201);
    }

    /** GET /projects/{project}/issued-items: products the project still holds (net qty > 0), by product name. */
    public function issuedItems(Request $request, Project $project, StockLedger $ledger): JsonResponse
    {
        $net = array_filter($ledger->projectNet($project->id), fn (array $row) => Dec::cmp($row['qty'], '0') > 0);
        $products = Product::with('unit')->whereIn('id', array_keys($net))->orderBy('name')->get();

        $rows = $products->map(fn (Product $product) => [
            'product' => $product,
            'qty' => $net[$product->id]['qty'],
            'value' => $net[$product->id]['value'],
        ]);

        return response()->json(['data' => IssuedItemResource::collection($rows)->resolve($request)]);
    }
}
