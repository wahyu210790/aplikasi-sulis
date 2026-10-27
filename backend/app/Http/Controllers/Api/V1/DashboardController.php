<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProjectStatus;
use App\Enums\PurchaseStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\PurchaseResource;
use App\Http\Resources\StockMovementResource;
use App\Http\Resources\StockTransactionResource;
use App\Models\Product;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\StockTransaction;
use App\Services\ProjectProfitService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * GET /dashboard (docs/desain-v2.md B9.2 Dashboard). Read-only, role-specific payload:
 *   Owner/Finance: totals, top 5 projects by profit, last 10 movements.
 *   Gudang: low-stock list, purchases waiting to be received, last 10 stock transactions — NO money keys (B7).
 */
class DashboardController extends Controller
{
    /** How many low-stock products and waiting purchases Gudang sees in the lists (the counts are always complete). */
    private const LIST_LIMIT = 10;

    public function __construct(private readonly ProjectProfitService $profit) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->user()->canSeeMoney() ? $this->moneyView() : $this->gudangView();

        return response()->json(['data' => $data]);
    }

    /** @return array<string, mixed> */
    private function moneyView(): array
    {
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->endOfMonth()->toDateString();

        // Material cost this month = −Σ value_change of project movements dated this month (issues, returns and reversals).
        $materialThisMonth = -1 * (int) StockMovement::query()
            ->whereNotNull('project_id')
            ->whereDate('movement_date', '>=', $monthStart)
            ->whereDate('movement_date', '<=', $monthEnd)
            ->sum('value_change');

        return [
            'view' => 'money',
            'month' => now()->format('Y-m'),
            'totals' => [
                'stock_value' => (int) StockBalance::query()->sum('stock_value'),
                'low_stock_count' => $this->lowStockQuery()->count(),
                'active_projects' => Project::query()->where('status', ProjectStatus::Aktif->value)->count(),
                'purchases_waiting' => $this->waitingPurchasesQuery()->count(),
                'material_cost_this_month' => $materialThisMonth,
            ],
            'top_projects' => $this->topProjects(),
            'recent_movements' => StockMovementResource::collection(
                StockMovement::query()->with(StockMovementResource::RELATIONS)
                    ->orderByDesc('movement_date')->orderByDesc('id')->limit(10)->get()
            ),
        ];
    }

    /** @return array<string, mixed> */
    private function gudangView(): array
    {
        $lowStock = $this->lowStockQuery()->with('unit', 'stockBalance')->orderBy('name')->limit(self::LIST_LIMIT)->get();

        return [
            'view' => 'gudang',
            'low_stock_count' => $this->lowStockQuery()->count(),
            'low_stock' => $lowStock->map(fn (Product $product) => [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'unit_symbol' => $product->unit->symbol,
                'qty' => $product->stockBalance?->qty ?? '0.000',
                'min_stock' => $product->min_stock,
            ])->values(),
            'purchases_waiting_count' => $this->waitingPurchasesQuery()->count(),
            'purchases_waiting' => PurchaseResource::collection(
                $this->waitingPurchasesQuery()->with('supplier', 'creator', 'receiver', 'canceller')->withCount('items')
                    ->orderBy('purchase_date')->orderBy('id')->limit(self::LIST_LIMIT)->get()
            ),
            'recent_transactions' => StockTransactionResource::collection(
                StockTransaction::query()->with('project', 'creator', 'reverser')->withCount('lines')
                    ->orderByDesc('transaction_date')->orderByDesc('id')->limit(10)->get()
            ),
        ];
    }

    /** Low stock = active product with min_stock > 0 and qty <= min_stock (same rule as GET /products?low_stock=1). */
    private function lowStockQuery(): Builder
    {
        return Product::query()
            ->where('is_active', true)
            ->where('min_stock', '>', 0)
            ->whereHas('stockBalance', fn ($q) => $q->whereColumn('stock_balances.qty', '<=', 'products.min_stock'));
    }

    /** "Waiting to be received" = purchases still in status draft (B3.10). */
    private function waitingPurchasesQuery(): Builder
    {
        return Purchase::query()->where('status', PurchaseStatus::Draft->value);
    }

    /**
     * Top 5 projects by profit (highest first; ties by code). Only status aktif and selesai — batal projects are left out.
     *
     * @return list<array<string, mixed>>
     */
    private function topProjects(): array
    {
        $projects = Project::query()
            ->whereIn('status', [ProjectStatus::Aktif->value, ProjectStatus::Selesai->value])
            ->orderBy('code')
            ->get();
        $ids = $projects->pluck('id')->all();
        $material = $this->profit->materialCosts($ids);
        $other = $this->profit->otherCosts($ids);

        return $projects
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'code' => $project->code,
                'name' => $project->name,
                'status' => $project->status->value,
                'contract_value' => (int) $project->contract_value,
                ...ProjectProfitService::row((int) $project->contract_value, $material[$project->id] ?? 0, $other[$project->id] ?? 0),
            ])
            ->sortBy([['profit', 'desc'], ['code', 'asc']])
            ->take(5)
            ->values()
            ->all();
    }
}
