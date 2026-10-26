<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Stock\StoreOpeningStockRequest;
use App\Http\Resources\StockMovementResource;
use App\Services\AuditLogger;
use App\Services\MovementContext;
use App\Services\StockLedger;
use App\Support\AuditAction;
use App\Support\Dec;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Opening stock, manual entry (docs/desain-v2.md B5.6). Owner and Finance only. */
class OpeningStockController extends Controller
{
    public function __construct(private readonly AuditLogger $audit, private readonly StockLedger $ledger) {}

    public function store(StoreOpeningStockRequest $request): JsonResponse
    {
        $date = $request->validated('movement_date');
        $lines = array_map(fn (array $item) => [
            'product_id' => (int) $item['product_id'],
            'qty' => (string) $item['qty'],
            'value' => Dec::roundRupiah(Dec::mul((string) $item['qty'], (string) $item['unit_cost'])),
        ], $request->validated('items'));

        $movements = DB::transaction(function () use ($lines, $date, $request) {
            $movements = $this->ledger->apply($lines, new MovementContext(MovementType::Opening, $date, $request->user()->id));
            $movements->load('product.unit', 'creator');

            $this->audit->log(
                AuditAction::OPENING_STOCK_CREATED,
                null,
                'Stok awal '.$movements->count().' barang tanggal '.$date,
                null,
                [
                    'movement_date' => $date,
                    'items' => $movements->map(fn ($m) => [
                        'sku' => $m->product->sku,
                        'qty' => $m->qty_change,
                        'unit_cost' => $m->unit_cost,
                        'value' => $m->value_change,
                    ])->all(),
                ],
            );

            return $movements;
        });

        return response()->json(['data' => StockMovementResource::collection($movements)->resolve($request)], 201);
    }
}
