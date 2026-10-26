<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\ListSuppliersRequest;
use App\Http\Requests\Supplier\StoreSupplierRequest;
use App\Http\Requests\Supplier\UpdateSupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\AuditLogger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SupplierController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(ListSuppliersRequest $request): JsonResponse
    {
        $query = Supplier::query();

        if ($search = $request->validated('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")->orWhere('phone', 'like', "%{$search}%");
            });
        }

        // ?all=1 -> active items only, no pagination (for dropdowns)
        if ($request->validated('all') === '1') {
            $items = $query->where('is_active', true)->orderBy('name')->limit(ApiPaginator::MAX_ALL)->get();

            return ApiPaginator::all($items, SupplierResource::class, $request);
        }

        if ($request->validated('is_active') !== null) {
            $query->where('is_active', (bool) $request->validated('is_active'));
        }

        $query->orderBy('name')->orderBy('id');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), SupplierResource::class, $request);
    }

    public function store(StoreSupplierRequest $request): JsonResponse
    {
        $supplier = DB::transaction(function () use ($request) {
            $supplier = Supplier::create([
                'name' => $request->validated('name'),
                'phone' => $request->validated('phone'),
                'address' => $request->validated('address'),
                'notes' => $request->validated('notes'),
                'is_active' => true,
            ]);

            $this->audit->log(AuditAction::SUPPLIER_CREATED, $supplier, "Menambah pemasok {$supplier->name}", null, $this->snapshot($supplier));

            return $supplier;
        });

        return response()->json(['data' => (new SupplierResource($supplier))->resolve($request)], 201);
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): JsonResponse
    {
        DB::transaction(function () use ($request, $supplier) {
            $before = $this->snapshot($supplier);

            $supplier->fill([
                'name' => $request->validated('name'),
                'phone' => $request->validated('phone'),
                'address' => $request->validated('address'),
                'notes' => $request->validated('notes'),
                'is_active' => (bool) $request->validated('is_active'),
            ])->save();

            $after = $this->snapshot($supplier);

            if ($before !== $after) {
                $this->audit->log(AuditAction::SUPPLIER_UPDATED, $supplier, "Mengubah pemasok {$supplier->name}", $before, $after);
            }
        });

        return response()->json(['data' => (new SupplierResource($supplier->fresh()))->resolve($request)]);
    }

    private function snapshot(Supplier $supplier): array
    {
        return [
            'name' => $supplier->name,
            'phone' => $supplier->phone,
            'address' => $supplier->address,
            'notes' => $supplier->notes,
            'is_active' => $supplier->is_active,
        ];
    }
}
