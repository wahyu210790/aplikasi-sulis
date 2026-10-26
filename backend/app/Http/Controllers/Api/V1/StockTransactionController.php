<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\ListStockTransactionsRequest;
use App\Http\Resources\StockTransactionResource;
use App\Models\StockTransaction;
use App\Support\ApiPaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Stock-out and return documents: list and detail (docs/desain-v2.md B9.2). Everyone; Gudang without money (B7). */
class StockTransactionController extends Controller
{
    public function index(ListStockTransactionsRequest $request): JsonResponse
    {
        $query = StockTransaction::query()
            ->with('project', 'creator', 'reverser')
            ->withCount('lines')
            ->withSum('lines', 'value_change');

        if ($search = $request->validated('search')) {
            $query->where(fn ($q) => $q->where('number', 'like', "%{$search}%")->orWhere('person_name', 'like', "%{$search}%"));
        }
        foreach (['type', 'status', 'project_id'] as $filter) {
            if ($value = $request->validated($filter)) {
                $query->where($filter, $value);
            }
        }
        if ($productId = $request->validated('product_id')) {
            $query->whereHas('lines', fn ($q) => $q->where('product_id', $productId));
        }
        if ($from = $request->validated('date_from')) {
            $query->whereDate('transaction_date', '>=', $from);
        }
        if ($to = $request->validated('date_to')) {
            $query->whereDate('transaction_date', '<=', $to);
        }

        $query->orderBy('transaction_date', 'desc')->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), StockTransactionResource::class, $request);
    }

    public function show(Request $request, StockTransaction $stockTransaction): JsonResponse
    {
        return self::respond($request, $stockTransaction);
    }

    /** Single-document response with header and lines. Also used by the create endpoints. */
    public static function respond(Request $request, StockTransaction $document, int $status = 200): JsonResponse
    {
        $document = $document->fresh(['project', 'creator', 'reverser', 'lines.product.unit']);

        return response()->json(['data' => (new StockTransactionResource($document))->resolve($request)], $status);
    }
}
