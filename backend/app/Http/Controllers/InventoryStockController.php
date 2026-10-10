<?php

namespace App\Http\Controllers;

use App\Models\InventoryStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InventoryStockController extends Controller
{
    /**
     * List all inventory stocks.
     */
    public function index(Request $request)
    {
        $query = InventoryStock::with(['product.category']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $categoryId = $request->input('category_id');
            $query->whereHas('product', function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId);
            });
        }

        if ($request->has('low_stock') && $request->input('low_stock') !== null && $request->input('low_stock') !== '') {
            $isLow = $request->input('low_stock');
            if ($isLow == '1' || $isLow === 'true' || $isLow === true) {
                if (\Illuminate\Support\Facades\Schema::hasColumn('inventory_stocks', 'minimum_stock')) {
                    $query->whereColumn('quantity', '<=', 'minimum_stock');
                } else {
                    $query->where('quantity', '<=', 5);
                }
            } elseif ($isLow == '0' || $isLow === 'false' || $isLow === false) {
                if (\Illuminate\Support\Facades\Schema::hasColumn('inventory_stocks', 'minimum_stock')) {
                    $query->whereColumn('quantity', '>', 'minimum_stock');
                } else {
                    $query->where('quantity', '>', 5);
                }
            }
        }

        $sort = $request->input('sort', 'product_name');
        $direction = strtolower($request->input('direction')) === 'desc' ? 'desc' : 'asc';

        if (in_array($sort, ['quantity', 'average_cost', 'total_value', 'created_at'])) {
            $query->orderBy($sort, $direction);
        } else {
            $query->orderBy(
                Product::select('name')
                    ->whereColumn('products.id', 'inventory_stocks.product_id')
                    ->limit(1),
                $direction
            );
        }

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        return response()->json($query->paginate($perPage), Response::HTTP_OK);
    }

    /**
     * Show stock for a single product.
     */
    public function show(Request $request, $productId)
    {
        $stock = InventoryStock::where('product_id', $productId)->with('product')->first();
        if (! $stock) {
            return response()->json(['message' => 'Stock not found', 'data' => null], Response::HTTP_NOT_FOUND);
        }
        return response()->json([
            'message' => 'Stock detail',
            'data' => $stock,
        ], Response::HTTP_OK);
    }
}
?>
