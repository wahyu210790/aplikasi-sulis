<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\ListMovementsRequest;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Models\StockMovement;
use App\Support\ApiPaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;

/**
 * Ledger views (docs/desain-v2.md B9.2): one product's history and the movements report.
 * Everyone may read; Gudang gets no money keys (B7). Newest first (by id = the order they were written).
 */
class StockMovementController extends Controller
{
    public function product(ListMovementsRequest $request, Product $product): JsonResponse
    {
        return $this->list($request, StockMovement::query()->where('product_id', $product->id));
    }

    public function report(ListMovementsRequest $request): JsonResponse
    {
        $query = StockMovement::query();
        if ($productId = $request->validated('product_id')) {
            $query->where('product_id', $productId);
        }

        return $this->list($request, $query);
    }

    private function list(ListMovementsRequest $request, Builder $query): JsonResponse
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

        $query->with(StockMovementResource::RELATIONS)->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), StockMovementResource::class, $request);
    }
}
