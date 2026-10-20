<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class InventoryTransactionController extends Controller
{
    /**
     * Ensure user has permission for inventory transactions.
     */
    protected function authorizeTransaction()
    {
        $user = request()->user();
        if (! $user || ! in_array($user->role, ['owner', 'warehouse'])) {
            return response()->json(['message' => 'Forbidden'], 403);
        }
        return null;
    }

    /**
     * Handle PURCHASE_IN transaction.
     */
    public function purchaseIn(Request $request)
    {
        if ($response = $this->authorizeTransaction()) {
            return $response;
        }
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|numeric|gt:0',
            'unit_cost'  => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'data' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $userId = $request->user()->id;
        return DB::transaction(function () use ($data, $userId) {
            $movement = InventoryMovement::create([
                'product_id' => $data['product_id'],
                'type' => 'PURCHASE_IN',
                'quantity' => $data['quantity'],
                'unit_cost' => $data['unit_cost'],
                'total_cost' => $data['quantity'] * $data['unit_cost'],
                'transaction_date' => $data['transaction_date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);

            $stock = InventoryStock::firstOrCreate(
                ['product_id' => $data['product_id']],
                ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0]
            );
            $stock = InventoryStock::whereKey($stock->id)->lockForUpdate()->first();
            $oldQty = $stock->quantity;
            $oldAvg = $stock->average_cost;
            $newQty = $oldQty + $data['quantity'];
            $newAvg = ($oldQty * $oldAvg + $data['quantity'] * $data['unit_cost']) / $newQty;
            $stock->quantity = $newQty;
            $stock->average_cost = $newAvg;
            $stock->total_value = $newQty * $newAvg;
            $stock->save();

            return response()->json([
                'message' => 'Purchase in recorded',
                'data' => $movement,
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Handle PROJECT_USAGE transaction.
     */
    public function projectUsage(Request $request)
    {
        if ($response = $this->authorizeTransaction()) {
            return $response;
        }
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'project_id' => 'required|exists:projects,id',
            'quantity'   => 'required|numeric|gt:0',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'data' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $project = Project::find($data['project_id']);
        if (in_array($project->status, ['cancelled'])) {
            return response()->json(['message' => 'Project is cancelled'], 400);
        }
        $userId = $request->user()->id;
        return DB::transaction(function () use ($data, $userId, $project) {
            $stock = InventoryStock::where('product_id', $data['product_id'])->lockForUpdate()->first();
            if (! $stock || $stock->quantity < $data['quantity']) {
                return response()->json(['message' => 'Insufficient stock'], 400);
            }
            $unitCost = $stock->average_cost;
            $totalCost = $unitCost * $data['quantity'];
            $movement = InventoryMovement::create([
                'product_id' => $data['product_id'],
                'type' => 'PROJECT_USAGE',
                'quantity' => $data['quantity'],
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'project_id' => $data['project_id'],
                'transaction_date' => $data['transaction_date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);
            $stock->quantity -= $data['quantity'];
            $stock->total_value = $stock->quantity * $stock->average_cost;
            $stock->save();
            return response()->json([
                'message' => 'Project usage recorded',
                'data' => $movement,
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Handle STOCK_OUT transaction.
     */
    public function stockOut(Request $request)
    {
        if ($response = $this->authorizeTransaction()) {
            return $response;
        }
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|numeric|gt:0',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'data' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $userId = $request->user()->id;
        return DB::transaction(function () use ($data, $userId) {
            $stock = InventoryStock::where('product_id', $data['product_id'])->lockForUpdate()->first();
            if (! $stock || $stock->quantity < $data['quantity']) {
                return response()->json(['message' => 'Insufficient stock'], 400);
            }
            $unitCost = $stock->average_cost;
            $totalCost = $unitCost * $data['quantity'];
            $movement = InventoryMovement::create([
                'product_id' => $data['product_id'],
                'type' => 'STOCK_OUT',
                'quantity' => $data['quantity'],
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'transaction_date' => $data['transaction_date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);
            $stock->quantity -= $data['quantity'];
            $stock->total_value = $stock->quantity * $stock->average_cost;
            $stock->save();
            return response()->json([
                'message' => 'Stock out recorded',
                'data' => $movement,
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Handle ADJUSTMENT_IN transaction.
     */
    public function adjustmentIn(Request $request)
    {
        if ($response = $this->authorizeTransaction()) {
            return $response;
        }
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|numeric|gt:0',
            'unit_cost'  => 'required|numeric|min:0',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'data' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $userId = $request->user()->id;
        return DB::transaction(function () use ($data, $userId) {
            $movement = InventoryMovement::create([
                'product_id' => $data['product_id'],
                'type' => 'ADJUSTMENT_IN',
                'quantity' => $data['quantity'],
                'unit_cost' => $data['unit_cost'],
                'total_cost' => $data['quantity'] * $data['unit_cost'],
                'transaction_date' => $data['transaction_date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);
            $stock = InventoryStock::firstOrCreate(
                ['product_id' => $data['product_id']],
                ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0]
            );
            $stock = InventoryStock::whereKey($stock->id)->lockForUpdate()->first();
            $oldQty = $stock->quantity;
            $oldAvg = $stock->average_cost;
            $newQty = $oldQty + $data['quantity'];
            $newAvg = ($oldQty * $oldAvg + $data['quantity'] * $data['unit_cost']) / $newQty;
            $stock->quantity = $newQty;
            $stock->average_cost = $newAvg;
            $stock->total_value = $newQty * $newAvg;
            $stock->save();
            return response()->json([
                'message' => 'Adjustment in recorded',
                'data' => $movement,
            ], Response::HTTP_CREATED);
        });
    }

    /**
     * Handle ADJUSTMENT_OUT transaction.
     */
    public function adjustmentOut(Request $request)
    {
        if ($response = $this->authorizeTransaction()) {
            return $response;
        }
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|numeric|gt:0',
            'transaction_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['message' => 'Validation error', 'data' => $validator->errors()], 422);
        }
        $data = $validator->validated();
        $userId = $request->user()->id;
        return DB::transaction(function () use ($data, $userId) {
            $stock = InventoryStock::where('product_id', $data['product_id'])->lockForUpdate()->first();
            if (! $stock || $stock->quantity < $data['quantity']) {
                return response()->json(['message' => 'Insufficient stock'], 400);
            }
            $unitCost = $stock->average_cost;
            $totalCost = $unitCost * $data['quantity'];
            $movement = InventoryMovement::create([
                'product_id' => $data['product_id'],
                'type' => 'ADJUSTMENT_OUT',
                'quantity' => $data['quantity'],
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'transaction_date' => $data['transaction_date'],
                'notes' => $data['notes'] ?? null,
                'created_by' => $userId,
            ]);
            $stock->quantity -= $data['quantity'];
            $stock->total_value = $stock->quantity * $stock->average_cost;
            $stock->save();
            return response()->json([
                'message' => 'Adjustment out recorded',
                'data' => $movement,
            ], Response::HTTP_CREATED);
        });
    }
}
?>
