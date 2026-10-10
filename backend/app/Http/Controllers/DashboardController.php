<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\Purchase;
use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\StockOpname;

class DashboardController extends Controller
{
    /**
     * Owner dashboard – full view.
     */
    public function owner(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'owner') {
            abort(403, 'Forbidden');
        }

        // Inventory aggregates
        $totalProducts = Product::count();
        $totalQuantity = InventoryStock::sum('quantity');
        $totalStockValue = InventoryStock::selectRaw('SUM(quantity * average_cost) as total')->value('total') ?? 0;

        // Purchase aggregates
        $totalPurchaseValue = Purchase::where('status', 'CONFIRMED')->sum('total_amount');

        // Project profitability aggregates
        $totalRevenue = Project::sum('revenue');
        $materialCost = DB::table('inventory_movements')
            ->where('type', 'PROJECT_USAGE')
            ->sum('total_cost');
        $otherExpenses = ProjectExpense::sum('amount');
        $totalCost = $materialCost + $otherExpenses;
        $grossProfit = $totalRevenue - $totalCost;
        $margin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

        // Recent collections (limit 5)
        $recentPurchases = Purchase::orderByDesc('created_at')->limit(5)->get();
        $recentProjects = Project::orderByDesc('created_at')->limit(5)->get();
        $recentMovements = InventoryMovement::orderByDesc('created_at')->limit(5)->get();

        return response()->json([
            'total_products' => $totalProducts,
            'total_quantity' => $totalQuantity,
            'total_stock_value' => $totalStockValue,
            'total_purchase_value' => $totalPurchaseValue,
            'total_revenue' => $totalRevenue,
            'gross_profit' => $grossProfit,
            'overall_margin_percent' => round($margin, 2),
            'recent_purchases' => $recentPurchases,
            'recent_projects' => $recentProjects,
            'recent_stock_movements' => $recentMovements,
        ]);
    }

    /**
     * Warehouse dashboard – inventory only.
     */
    public function warehouse(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'warehouse') {
            abort(403, 'Forbidden');
        }

        $totalProducts = Product::count();
        $totalQuantity = InventoryStock::sum('quantity');
        $totalStockValue = InventoryStock::selectRaw('SUM(quantity * average_cost) as total')->value('total') ?? 0;
        $recentMovements = InventoryMovement::orderByDesc('created_at')->limit(5)->get();
        $recentStockOpnames = StockOpname::orderByDesc('created_at')->limit(5)->get();

        return response()->json([
            'total_products' => $totalProducts,
            'total_quantity' => $totalQuantity,
            'total_stock_value' => $totalStockValue,
            'recent_stock_movements' => $recentMovements,
            'recent_stock_opnames' => $recentStockOpnames,
        ]);
    }

    /**
     * Finance dashboard – financial overview.
     */
    public function finance(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'finance') {
            abort(403, 'Forbidden');
        }

        // Financial aggregates
        $totalPurchaseValue = Purchase::where('status', 'CONFIRMED')->sum('total_amount');
        $totalRevenue = Project::sum('revenue');
        $materialCost = DB::table('inventory_movements')
            ->where('type', 'PROJECT_USAGE')
            ->sum('total_cost');
        $otherExpenses = ProjectExpense::sum('amount');
        $totalCost = $materialCost + $otherExpenses;
        $grossProfit = $totalRevenue - $totalCost;
        $margin = $totalRevenue > 0 ? ($grossProfit / $totalRevenue) * 100 : 0;

        $recentPurchases = Purchase::orderByDesc('created_at')->limit(5)->get();
        $recentExpenses = ProjectExpense::orderByDesc('created_at')->limit(5)->get();
        $recentProjects = Project::orderByDesc('created_at')->limit(5)->get();

        return response()->json([
            'total_purchase_value' => $totalPurchaseValue,
            'total_revenue' => $totalRevenue,
            'gross_profit' => $grossProfit,
            'overall_margin_percent' => round($margin, 2),
            'recent_purchases' => $recentPurchases,
            'recent_expenses' => $recentExpenses,
            'recent_projects' => $recentProjects,
        ]);
    }
}
