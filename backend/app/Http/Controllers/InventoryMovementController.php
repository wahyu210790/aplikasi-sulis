<?php

namespace App\Http\Controllers;

use App\Models\InventoryMovement;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InventoryMovementController extends Controller
{
    /**
     * List movements for a given product.
     */
    public function index(Request $request, $productId)
    {
        $movements = InventoryMovement::where('product_id', $productId)
            ->orderBy('transaction_date', 'desc')
            ->get();
        return response()->json([
            'message' => 'Movements list',
            'data' => $movements,
        ], Response::HTTP_OK);
    }
}
?>
