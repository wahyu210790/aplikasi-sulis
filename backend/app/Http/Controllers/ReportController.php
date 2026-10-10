<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Project;
use App\Models\ProjectExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    /**
     * Authorize request based on allowed roles.
     */
    private function authorize(Request $request, array $allowedRoles)
    {
        $user = $request->user();
        if (! $user || ! in_array($user->role, $allowedRoles)) {
            abort(Response::HTTP_FORBIDDEN, 'Forbidden');
        }
    }

    /**
     * GET /api/v1/reports/inventory-summary
     */
    public function inventorySummary(Request $request)
    {
        $this->authorize($request, ['owner', 'warehouse']);

        $totalProducts = Product::count();
        $totalQuantity = InventoryStock::sum('quantity');
        $totalValue = InventoryStock::sum('total_value');
        $zeroStock = InventoryStock::where('quantity', 0)->count();
        // low stock: count products where a `minimum_stock` column exists and quantity < minimum_stock
        $lowStock = 0;
        if (Schema::hasColumn('inventory_stocks', 'minimum_stock')) {
            $lowStock = InventoryStock::whereColumn('quantity', '<', 'minimum_stock')->count();
        }

        return response()->json([
            'total_products' => $totalProducts,
            'total_quantity' => $totalQuantity,
            'total_value' => $totalValue,
            'zero_stock' => $zeroStock,
            'low_stock' => $lowStock,
        ]);
    }

    /**
     * GET /api/v1/reports/stock-movements
     */
    public function stockMovements(Request $request)
    {
        $this->authorize($request, ['owner', 'finance', 'warehouse']);
        $query = InventoryMovement::query()->with(['product', 'project', 'creator']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('product', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }
        if ($request->filled('product_id')) {
            $query->where('product_id', $request->input('product_id'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('project_id')) {
            $query->where('project_id', $request->input('project_id'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('transaction_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('transaction_date', '<=', $request->input('date_to'));
        }

        $sort = in_array($request->input('sort'), ['transaction_date', 'quantity', 'unit_cost', 'total_cost', 'created_at']) ? $request->input('sort') : 'transaction_date';
        $direction = strtolower($request->input('direction')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sort, $direction);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        $movements = $query->paginate($perPage);

        $data = $movements->getCollection()->transform(function ($m) {
            return [
                'id' => $m->id,
                'date' => $m->transaction_date,
                'product' => $m->product ? $m->product->only(['id', 'name']) : null,
                'type' => $m->type,
                'quantity' => $m->quantity,
                'unit_cost' => $m->unit_cost,
                'total_cost' => $m->total_cost,
                'project' => $m->project ? $m->project->only(['id', 'name']) : null,
                'reference_type' => $m->reference_type,
                'reference_id' => $m->reference_id,
                'created_by' => $m->creator ? $m->creator->only(['id', 'name']) : null,
                'notes' => $m->notes,
            ];
        })->toArray();

        return response()->json([
            'current_page' => $movements->currentPage(),
            'last_page' => $movements->lastPage(),
            'per_page' => $movements->perPage(),
            'total' => $movements->total(),
            'data' => $data,
        ]);
    }

    /**
     * GET /api/v1/reports/purchase-summary
     */
    public function purchaseSummary(Request $request)
    {
        $this->authorize($request, ['owner', 'finance']);
        $query = Purchase::query();

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        } else {
            $query->where('status', 'CONFIRMED');
        }
        if ($request->filled('date_from')) {
            $query->whereDate('purchase_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('purchase_date', '<=', $request->input('date_to'));
        }

        $totalPurchases = $query->count();
        $totalAmount = $query->sum('total_amount');
        // total quantity via related items
        $totalQuantity = PurchaseItem::whereIn('purchase_id', $query->pluck('id'))->sum('quantity');

        $byStatusQuery = Purchase::query();
        if ($request->filled('supplier_id')) {
            $byStatusQuery->where('supplier_id', $request->input('supplier_id'));
        }
        if ($request->filled('date_from')) {
            $byStatusQuery->whereDate('purchase_date', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $byStatusQuery->whereDate('purchase_date', '<=', $request->input('date_to'));
        }
        $byStatus = $byStatusQuery->select('status', DB::raw('count(*) as count'), DB::raw('sum(total_amount) as amount'))
            ->groupBy('status')
            ->get();
        $bySupplier = $query->select('supplier_id', DB::raw('count(*) as count'), DB::raw('sum(total_amount) as amount'))
            ->groupBy('supplier_id')
            ->with('supplier:id,name')
            ->get()
            ->map(function ($row) {
                return [
                    'supplier_id' => $row->supplier_id,
                    'supplier_name' => optional($row->supplier)->name,
                    'count' => $row->count,
                    'amount' => $row->amount,
                ];
            });

        return response()->json([
            'total_purchases' => $totalPurchases,
            'total_amount' => $totalAmount,
            'total_quantity' => $totalQuantity,
            'by_status' => $byStatus,
            'by_supplier' => $bySupplier,
        ]);
    }

    /**
     * GET /api/v1/reports/project-profitability
     */
    public function projectProfitability(Request $request)
    {
        $this->authorize($request, ['owner', 'finance']);
        $query = Project::with('expenses');

        if ($request->filled('project_id')) {
            $query->where('id', $request->input('project_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $projects = $query->get();
        $data = $projects->map(function ($project) {
            $materialCost = DB::table('inventory_movements')
                ->where('project_id', $project->id)
                ->where('type', 'PROJECT_USAGE')
                ->sum('total_cost');
            $otherExpenses = $project->expenses->sum('amount');
            $totalCost = $materialCost + $otherExpenses;
            $grossProfit = $project->revenue - $totalCost;
            $margin = $project->revenue > 0 ? ($grossProfit / $project->revenue) * 100 : 0;
            return [
                'project_id' => $project->id,
                'project_name' => $project->name,
                'revenue' => $project->revenue,
                'material_cost' => $materialCost,
                'other_expenses' => $otherExpenses,
                'total_cost' => $totalCost,
                'gross_profit' => $grossProfit,
                'margin_percent' => round($margin, 2),
            ];
        });
        return response()->json($data);
    }

    /**
     * GET /api/v1/reports/financial-overview
     */
    public function financialOverview(Request $request)
    {
        $this->authorize($request, ['owner', 'finance']);
        $purchaseQuery = Purchase::where('status', 'CONFIRMED');
        $projectQuery = Project::query();

        if ($request->filled('date_from')) {
            $purchaseQuery->whereDate('purchase_date', '>=', $request->input('date_from'));
            $projectQuery->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $purchaseQuery->whereDate('purchase_date', '<=', $request->input('date_to'));
            $projectQuery->whereDate('created_at', '<=', $request->input('date_to'));
        }

        $totalPurchase = $purchaseQuery->sum('total_amount');
        $totalProjectRevenue = $projectQuery->sum('revenue');
        $materialCost = DB::table('inventory_movements')
            ->where('type', 'PROJECT_USAGE')
            ->when($request->filled('date_from'), function ($q) use ($request) {
                $q->whereDate('transaction_date', '>=', $request->input('date_from'));
            })
            ->when($request->filled('date_to'), function ($q) use ($request) {
                $q->whereDate('transaction_date', '<=', $request->input('date_to'));
            })
            ->sum('total_cost');
        $otherExpenses = ProjectExpense::when($request->filled('date_from'), function ($q) use ($request) {
                $q->whereDate('created_at', '>=', $request->input('date_from'));
            })
            ->when($request->filled('date_to'), function ($q) use ($request) {
                $q->whereDate('created_at', '<=', $request->input('date_to'));
            })
            ->sum('amount');
        $totalProjectCost = $materialCost + $otherExpenses;
        $grossProfit = $totalProjectRevenue - $totalProjectCost;
        $margin = $totalProjectRevenue > 0 ? ($grossProfit / $totalProjectRevenue) * 100 : 0;

        return response()->json([
            'total_purchase' => $totalPurchase,
            'total_project_revenue' => $totalProjectRevenue,
            'total_material_cost' => $materialCost,
            'total_other_project_expenses' => $otherExpenses,
            'total_project_cost' => $totalProjectCost,
            'gross_profit' => $grossProfit,
            'margin_percent' => round($margin, 2),
        ]);
    }

    /**
     * GET /api/v1/reports/projects/{project}/cost-detail
     */
    public function projectCostDetail(Request $request, Project $project)
    {
        $this->authorize($request, ['owner', 'finance']);
        $materialCost = DB::table('inventory_movements')
            ->where('project_id', $project->id)
            ->where('type', 'PROJECT_USAGE')
            ->sum('total_cost');
        $otherExpenses = $project->expenses->sum('amount');
        $totalCost = $materialCost + $otherExpenses;
        $grossProfit = $project->revenue - $totalCost;
        $margin = $project->revenue > 0 ? ($grossProfit / $project->revenue) * 100 : 0;

        return response()->json([
            'project_id' => $project->id,
            'project_name' => $project->name,
            'revenue' => $project->revenue,
            'material_cost' => $materialCost,
            'other_expenses' => $otherExpenses,
            'total_cost' => $totalCost,
            'gross_profit' => $grossProfit,
            'margin_percent' => round($margin, 2),
        ]);
    }
}
?>
