<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Unit\ListUnitsRequest;
use App\Http\Requests\Unit\StoreUnitRequest;
use App\Http\Requests\Unit\UpdateUnitRequest;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use App\Services\AuditLogger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class UnitController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(ListUnitsRequest $request): JsonResponse
    {
        $query = Unit::query();

        if ($search = $request->validated('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('symbol', 'like', "%{$search}%");
            });
        }

        // ?all=1 -> active items only, no pagination (for dropdowns)
        if ($request->validated('all') === '1') {
            $items = $query->where('is_active', true)->orderBy('name')->limit(ApiPaginator::MAX_ALL)->get();

            return ApiPaginator::all($items, UnitResource::class, $request);
        }

        if ($request->validated('is_active') !== null) {
            $query->where('is_active', (bool) $request->validated('is_active'));
        }

        $query->orderBy('name')->orderBy('id');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), UnitResource::class, $request);
    }

    public function store(StoreUnitRequest $request): JsonResponse
    {
        $unit = DB::transaction(function () use ($request) {
            $unit = Unit::create([
                'name' => $request->validated('name'),
                'symbol' => $request->validated('symbol'),
                'is_active' => true,
            ]);

            $this->audit->log(AuditAction::UNIT_CREATED, $unit, "Menambah satuan {$unit->name} ({$unit->symbol})", null, $this->snapshot($unit));

            return $unit;
        });

        return response()->json(['data' => (new UnitResource($unit))->resolve($request)], 201);
    }

    public function update(UpdateUnitRequest $request, Unit $unit): JsonResponse
    {
        DB::transaction(function () use ($request, $unit) {
            $before = $this->snapshot($unit);

            $unit->fill([
                'name' => $request->validated('name'),
                'symbol' => $request->validated('symbol'),
                'is_active' => (bool) $request->validated('is_active'),
            ])->save();

            $after = $this->snapshot($unit);

            if ($before !== $after) {
                $this->audit->log(AuditAction::UNIT_UPDATED, $unit, AuditLogger::editVerb($before, $after)." satuan {$unit->name} ({$unit->symbol})", $before, $after);
            }
        });

        return response()->json(['data' => (new UnitResource($unit->fresh()))->resolve($request)]);
    }

    private function snapshot(Unit $unit): array
    {
        return ['name' => $unit->name, 'symbol' => $unit->symbol, 'is_active' => $unit->is_active];
    }
}
