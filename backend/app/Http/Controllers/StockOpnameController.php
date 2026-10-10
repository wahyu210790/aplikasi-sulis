<?php

namespace App\Http\Controllers;

use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\InventoryStock;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class StockOpnameController extends Controller
{
    /**
     * List all stock opnames.
     */
    public function index(Request $request)
    {
        if (!$request->user() || !in_array($request->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        $query = StockOpname::with('items.product');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('opname_number', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('opname_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('opname_date', '<=', $request->input('date_to'));
        }

        $sort = in_array($request->input('sort'), ['opname_number', 'opname_date', 'status', 'created_at']) ? $request->input('sort') : 'created_at';
        $direction = strtolower($request->input('direction')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $direction);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        return response()->json($query->paginate($perPage));
    }

    /**
     * Create a new stock opname (draft).
     */
    public function store(Request $request)
    {
        if (!$request->user() || !in_array($request->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        $data = $request->validate([
            'opname_number' => 'required|unique:stock_opnames,opname_number',
            'opname_date'   => 'required|date',
            'notes'         => 'nullable|string',
        ]);
        $data['created_by'] = $request->user()->id;
        $stockOpname = StockOpname::create($data);
        return response()->json($stockOpname, Response::HTTP_CREATED);
    }

    /**
     * Show a specific stock opname with its items.
     */
    public function show(Request $request, StockOpname $stockOpname)
    {
        if (!$request->user() || !in_array($request->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        $stockOpname->load('items.product');
        return response()->json($stockOpname);
    }

    /**
     * Update a draft stock opname.
     */
    public function update(Request $request, StockOpname $stockOpname)
    {
        if (!request()->user() || !in_array(request()->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($stockOpname->status !== 'DRAFT') {
            return response()->json(['message' => 'Only draft can be edited'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $data = $request->validate([
            'opname_date' => 'sometimes|date',
            'notes'       => 'nullable|string',
        ]);
        $stockOpname->update($data);
        return response()->json($stockOpname);
    }

    /**
     * Delete a draft stock opname.
     */
    public function destroy(StockOpname $stockOpname)
    {
        if (!request()->user() || !in_array(request()->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($stockOpname->status !== 'DRAFT') {
            return response()->json(['message' => 'Only draft can be deleted'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $stockOpname->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Add an item to a draft stock opname.
     */
    public function addItem(Request $request, StockOpname $stockOpname)
    {
        if (!request()->user() || !in_array(request()->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($stockOpname->status !== 'DRAFT') {
            return response()->json(['message' => 'Cannot add items to non‑draft'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $data = $request->validate([
            'product_id'        => 'required|exists:products,id',
            'physical_quantity' => 'required|numeric|min:0',
            'notes'             => 'nullable|string',
        ]);
        // Snapshot system quantity
        $stock = InventoryStock::where('product_id', $data['product_id'])->first();
        $systemQty = $stock ? $stock->quantity : 0;
        $difference = $data['physical_quantity'] - $systemQty;
        $item = $stockOpname->items()->create([
            'product_id'        => $data['product_id'],
            'system_quantity'   => $systemQty,
            'physical_quantity' => $data['physical_quantity'],
            'difference_quantity'=> $difference,
            'notes'             => $data['notes'] ?? null,
        ]);
        return response()->json($item, Response::HTTP_CREATED);
    }

    /**
     * Update an item while draft.
     */
    public function updateItem(Request $request, StockOpname $stockOpname, StockOpnameItem $item)
    {
        if (!request()->user() || !in_array(request()->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($stockOpname->status !== 'DRAFT' || $item->stock_opname_id !== $stockOpname->id) {
            return response()->json(['message' => 'Cannot edit'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $data = $request->validate([
            'physical_quantity' => 'required|numeric|min:0',
            'notes'             => 'nullable|string',
        ]);
        $item->physical_quantity = $data['physical_quantity'];
        $item->difference_quantity = $data['physical_quantity'] - $item->system_quantity;
        $item->notes = $data['notes'] ?? $item->notes;
        $item->save();
        return response()->json($item);
    }

    /**
     * Delete an item while draft.
     */
    public function deleteItem(StockOpname $stockOpname, StockOpnameItem $item)
    {
        if (!request()->user() || !in_array(request()->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($stockOpname->status !== 'DRAFT' || $item->stock_opname_id !== $stockOpname->id) {
            return response()->json(['message' => 'Cannot delete'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $item->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }

    /**
     * Complete a stock opname – creates adjustments.
     */
    public function complete(Request $request, StockOpname $stockOpname)
    {
        if (!request()->user() || !in_array(request()->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($stockOpname->status !== 'DRAFT') {
            return response()->json(['message' => 'Only draft can be completed'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        try {
            DB::transaction(function () use ($stockOpname, $request) {
                foreach ($stockOpname->items as $item) {
                    $diff = $item->difference_quantity;
                    if ($diff == 0) {
                        continue;
                    }
                    if ($diff > 0) {
                        // adjustment in
                        $movement = InventoryService::recordAdjustmentIn($item->product_id, $diff, $request->user()->id);
                    } else {
                        // adjustment out – use absolute value
                        $movement = InventoryService::recordAdjustmentOut($item->product_id, abs($diff), $request->user()->id);
                    }
                    // attach reference after movement created
                    $movement->reference_type = 'stock_opname';
                    $movement->reference_id = $stockOpname->id;
                    $movement->save();
                }
                $stockOpname->status = 'COMPLETED';
                $stockOpname->completed_at = now();
                $stockOpname->save();
            });
            return response()->json($stockOpname);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
    }

    /**
     * Cancel a draft stock opname.
     */
    public function cancel(StockOpname $stockOpname)
    {
        if (!request()->user() || !in_array(request()->user()->role, ['owner','warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        if ($stockOpname->status !== 'DRAFT') {
            return response()->json(['message' => 'Only draft can be cancelled'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }
        $stockOpname->status = 'CANCELLED';
        $stockOpname->save();
        return response()->json($stockOpname);
    }
}
?>
