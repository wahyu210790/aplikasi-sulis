<?php

namespace App\Services;

use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class InventoryService
{
    /**
     * Record a PURCHASE_IN movement and update stock using the same logic as InventoryTransactionController.
     *
     * @param int $productId
     * @param int $quantity
     * @param float $unitCost
     * @param string $transactionDate (Y-m-d format)
     * @param int $createdBy
     * @return InventoryMovement
     */
    public static function recordPurchaseIn(int $productId, float $quantity, float $unitCost, string $transactionDate, int $createdBy)
    {
        return DB::transaction(function () use ($productId, $quantity, $unitCost, $transactionDate, $createdBy) {
            $movement = InventoryMovement::create([
                'product_id' => $productId,
                'type' => 'PURCHASE_IN',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $quantity * $unitCost,
                'transaction_date' => $transactionDate,
                'created_by' => $createdBy,
            ]);

            $stock = InventoryStock::firstOrCreate(
                ['product_id' => $productId],
                ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0]
            );
            $oldQty = $stock->quantity;
            $oldAvg = $stock->average_cost;
            $newQty = $oldQty + $quantity;
            $newAvg = ($oldQty * $oldAvg + $quantity * $unitCost) / $newQty;
            $stock->quantity = $newQty;
            $stock->average_cost = $newAvg;
            $stock->total_value = $newQty * $newAvg;
            $stock->save();

            return $movement;
        });
    }
    /**
     * Record an ADJUSTMENT_IN movement and update stock.
     * Uses current average cost as unit cost.
     */
    public static function recordAdjustmentIn(int $productId, float $quantity, int $createdBy)
    {
        return DB::transaction(function () use ($productId, $quantity, $createdBy) {
            // Use current average cost; if none, cost 0
            $stock = InventoryStock::firstOrCreate(
                ['product_id' => $productId],
                ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0]
            );
            $unitCost = $stock->average_cost > 0 ? $stock->average_cost : 0;

            // Update stock quantity and total value
            $stock->quantity += $quantity;
            $stock->total_value = $stock->quantity * $unitCost;
            $stock->save();

            $movement = InventoryMovement::create([
                'product_id' => $productId,
                'type' => 'ADJUSTMENT_IN',
                'quantity' => $quantity,
                'unit_cost' => $unitCost,
                'total_cost' => $quantity * $unitCost,
                'transaction_date' => now()->toDateString(),
                'created_by' => $createdBy,
            ]);

            return $movement;
        });
    }

    /**
     * Record an ADJUSTMENT_OUT movement and update stock.
     */
    public static function recordAdjustmentOut(int $productId, float $quantity, int $createdBy)
    {
        return DB::transaction(function () use ($productId, $quantity, $createdBy) {
            $stock = InventoryStock::firstOrCreate(
                ['product_id' => $productId],
                ['quantity' => 0, 'average_cost' => 0, 'total_value' => 0]
            );

            $oldQty = $stock->quantity;
            $oldAvg = $stock->average_cost;

            if ($oldQty < $quantity) {
                throw new \Exception('Insufficient stock for adjustment out');
            }

            $newQty = $oldQty - $quantity;
            // Average cost stays the same after removal
            $stock->quantity = $newQty;
            $stock->average_cost = $oldAvg;
            $stock->total_value = $newQty * $oldAvg;
            $stock->save();

            $movement = InventoryMovement::create([
                'product_id' => $productId,
                'type' => 'ADJUSTMENT_OUT',
                'quantity' => $quantity,
                'unit_cost' => $oldAvg,
                'total_cost' => $quantity * $oldAvg,
                'transaction_date' => now()->toDateString(),
                'created_by' => $createdBy,
                'reference_type' => 'stock_opname_item',
                'reference_id' => null,
            ]);

            return $movement;
        });
    }
}
?>
