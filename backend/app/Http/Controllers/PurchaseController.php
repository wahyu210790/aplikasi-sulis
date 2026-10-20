<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\Product;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class PurchaseController extends Controller
{
    /**
     * Authorize purchasing actions (owner & finance).
     */
    private function authorizePurchase()
    {
        $user = request()->user();
        if (! $user || ! in_array($user->role, ['owner', 'finance'])) {
            abort(403, 'Forbidden');
        }
    }

    public function index(Request $request)
    {
        $this->authorizePurchase();
        $query = Purchase::with(['supplier', 'items.product']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                         ->orWhere('code', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('date_from')) {
            $query->whereDate('purchase_date', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('purchase_date', '<=', $request->input('date_to'));
        }

        $sort = in_array($request->input('sort'), ['purchase_number', 'purchase_date', 'total_amount', 'status', 'created_at']) ? $request->input('sort') : 'created_at';
        $direction = strtolower($request->input('direction')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $direction);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $this->authorizePurchase();
        $validator = Validator::make($request->all(), [
            'supplier_id'   => 'required|exists:suppliers,id',
            'purchase_date' => 'required|date',
            'notes'         => 'sometimes|nullable|string',
            'items'         => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.001',
            'items.*.unit_cost'  => 'required|numeric|min:0',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $totalAmount = 0;
        foreach ($data['items'] as $item) {
            $totalAmount += $item['quantity'] * $item['unit_cost'];
        }
        $purchase = DB::transaction(function () use ($data, $totalAmount, $request) {
            $purchase = Purchase::create([
                'supplier_id'    => $data['supplier_id'],
                'purchase_number'=> 'PUR-'.strtoupper(uniqid()),
                'purchase_date' => $data['purchase_date'],
                'status'        => 'DRAFT',
                'notes'         => $data['notes'] ?? null,
                'total_amount'  => $totalAmount,
                'created_by'    => $request->user()->id,
            ]);
            foreach ($data['items'] as $item) {
                $purchase->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity'   => $item['quantity'],
                    'unit_cost'  => $item['unit_cost'],
                    'subtotal'   => $item['quantity'] * $item['unit_cost'],
                ]);
            }
            return $purchase;
        });
        return response()->json($purchase->load(['supplier', 'items.product']), Response::HTTP_CREATED);
    }

    public function show($id)
    {
        $this->authorizePurchase();
        $purchase = Purchase::with(['supplier', 'items.product'])->findOrFail($id);
        return response()->json($purchase);
    }

    public function update(Request $request, $id)
    {
        $this->authorizePurchase();
        $purchase = Purchase::findOrFail($id);
        if ($purchase->status !== 'DRAFT') {
            return response()->json(['message' => 'Only DRAFT purchases can be edited.'], 400);
        }
        $validator = Validator::make($request->all(), [
            'supplier_id'   => 'sometimes|exists:suppliers,id',
            'purchase_date' => 'sometimes|date',
            'notes'         => 'sometimes|nullable|string',
            'items'         => 'sometimes|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity'   => 'required|numeric|min:0.001',
            'items.*.unit_cost'  => 'required|numeric|min:0',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        DB::transaction(function () use ($purchase, $data) {
            $purchase->update([
                'supplier_id'    => $data['supplier_id'] ?? $purchase->supplier_id,
                'purchase_date' => $data['purchase_date'] ?? $purchase->purchase_date,
                'notes'         => $data['notes'] ?? $purchase->notes,
            ]);
            if (isset($data['items'])) {
                // remove old items and recreate
                $purchase->items()->delete();
                $totalAmount = 0;
                foreach ($data['items'] as $item) {
                    $subtotal = $item['quantity'] * $item['unit_cost'];
                    $totalAmount += $subtotal;
                    $purchase->items()->create([
                        'product_id' => $item['product_id'],
                        'quantity'   => $item['quantity'],
                        'unit_cost'  => $item['unit_cost'],
                        'subtotal'   => $subtotal,
                    ]);
                }
                $purchase->total_amount = $totalAmount;
                $purchase->save();
            }
        });
        return response()->json($purchase->load(['supplier', 'items.product']));
    }

    public function destroy($id)
    {
        $this->authorizePurchase();
        $purchase = Purchase::findOrFail($id);
        if ($purchase->status !== 'DRAFT') {
            return response()->json(['message' => 'Only DRAFT purchases can be deleted.'], 400);
        }
        $purchase->delete();
        return response()->json(null, 204);
    }

    public function confirm(Request $request, $id)
    {
        $this->authorizePurchase();
        $purchase = Purchase::with('items')->findOrFail($id);
        if ($purchase->status !== 'DRAFT') {
            return response()->json(['message' => 'Only DRAFT purchases can be confirmed.'], 422);
        }
        $alreadyProcessed = DB::transaction(function () use ($purchase, $request) {
            // lock row for update
            $purchase = Purchase::where('id', $purchase->id)->lockForUpdate()->first();
            // Re-check status after acquiring the lock so concurrent confirm
            // requests cannot add the same purchase to stock twice.
            if ($purchase->status !== 'DRAFT') {
                return true;
            }
            foreach ($purchase->items as $item) {
                InventoryService::recordPurchaseIn(
                    $item->product_id,
                    (float) $item->quantity,
                    (float) $item->unit_cost,
                    $purchase->purchase_date,
                    $purchase->created_by
                );
            }
            $purchase->status = 'CONFIRMED';
            $purchase->save();
            return false;
        });
        if ($alreadyProcessed) {
            return response()->json(['message' => 'Only DRAFT purchases can be confirmed.'], 422);
        }
        $purchase = $purchase->fresh(); return response()->json($purchase->load(['supplier', 'items.product']));
    }

    public function cancel($id)
    {
        $this->authorizePurchase();
        $purchase = Purchase::findOrFail($id);
        // Lock the row and re-check status so a concurrent confirm cannot be
        // overwritten to CANCELLED after stock has already been added.
        $cancelled = DB::transaction(function () use ($purchase) {
            $locked = Purchase::where('id', $purchase->id)->lockForUpdate()->first();
            if ($locked->status !== 'DRAFT') {
                return null;
            }
            $locked->status = 'CANCELLED';
            $locked->save();
            return $locked;
        });
        if (! $cancelled) {
            return response()->json(['message' => 'Only DRAFT purchases can be cancelled.'], 422);
        }
        return response()->json($cancelled);
    }
}
?>
