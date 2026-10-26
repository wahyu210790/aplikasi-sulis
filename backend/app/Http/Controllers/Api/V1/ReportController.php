<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\MovementType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\CostHistoryRequest;
use App\Http\Requests\Report\ProjectProfitReportRequest;
use App\Http\Requests\Report\StockValueReportRequest;
use App\Http\Resources\CostHistoryResource;
use App\Http\Resources\StockValueResource;
use App\Models\Product;
use App\Models\Project;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Services\ProjectProfitService;
use App\Support\ApiPaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Read-only reports (docs/desain-v2.md B9.2 Reports). Nothing here writes data.
 * Money keys are ABSENT for Gudang (B7); the money-only reports are limited to Owner/Finance by the routes (B6).
 */
class ReportController extends Controller
{
    public function __construct(private readonly ProjectProfitService $profit) {}

    /** GET /reports/project-profit — every project (optional ?status=) with its profit, plus totals. Owner/Finance. */
    public function projectProfit(ProjectProfitReportRequest $request): JsonResponse
    {
        $query = Project::query()->orderBy('code');
        if ($status = $request->validated('status')) {
            $query->where('status', $status);
        }
        $projects = $query->get();

        $ids = $projects->modelKeys();
        $material = $this->profit->materialCosts($ids);
        $other = $this->profit->otherCosts($ids);

        $rows = [];
        $sum = ['contract_value' => 0, 'material_cost' => 0, 'other_costs' => 0];
        foreach ($projects as $project) {
            $contract = (int) $project->contract_value;
            $row = ProjectProfitService::row($contract, $material[$project->id] ?? 0, $other[$project->id] ?? 0);
            $rows[] = [
                'id' => $project->id,
                'code' => $project->code,
                'name' => $project->name,
                'client_name' => $project->client_name,
                'status' => $project->status->value,
                'status_label' => $project->status->label(),
                'contract_value' => $contract,
                ...$row,
            ];
            $sum['contract_value'] += $contract;
            $sum['material_cost'] += $row['material_cost'];
            $sum['other_costs'] += $row['other_costs'];
        }

        return response()->json([
            'data' => $rows,
            'totals' => [
                'contract_value' => $sum['contract_value'],
                ...ProjectProfitService::row($sum['contract_value'], $sum['material_cost'], $sum['other_costs']),
            ],
        ]);
    }

    /**
     * GET /reports/projects/{project}/materials — per product: qty out, qty returned, net qty and net value.
     * Every role (B6 "project-usage"); Gudang gets the quantities only, without net_value and totals.
     */
    public function projectMaterials(Request $request, Project $project): JsonResponse
    {
        $seeMoney = $request->user()->canSeeMoney();
        $lines = $this->profit->materials($project);
        $products = Product::with('unit')->whereIn('id', array_column($lines, 'product_id'))->get()->keyBy('id');

        $rows = [];
        $total = 0;
        foreach ($lines as $line) {
            $product = $products[$line['product_id']];
            $row = [
                'product' => ['id' => $product->id, 'sku' => $product->sku, 'name' => $product->name, 'unit_symbol' => $product->unit->symbol],
                'qty_out' => $line['qty_out'],
                'qty_returned' => $line['qty_returned'],
                'net_qty' => $line['net_qty'],
            ];
            if ($seeMoney) {
                $row['net_value'] = $line['net_value'];
            }
            $total += $line['net_value'];
            $rows[] = $row;
        }
        usort($rows, fn (array $a, array $b) => strcmp($a['product']['name'], $b['product']['name']) ?: $a['product']['id'] <=> $b['product']['id']);

        $body = [
            'project' => ['id' => $project->id, 'code' => $project->code, 'name' => $project->name],
            'data' => $rows,
        ];
        if ($seeMoney) {
            $body['totals'] = ['net_value' => $total];
        }

        return response()->json($body);
    }

    /**
     * GET /reports/stock-value — per product: qty, average cost and stock value (paginated, by name),
     * plus totals.stock_value over ALL products that match the filters. Owner/Finance.
     */
    public function stockValue(StockValueReportRequest $request): JsonResponse
    {
        $query = Product::query();
        if ($search = $request->validated('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%");
            });
        }
        if ($categoryId = $request->validated('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($request->validated('is_active') !== null) {
            $query->where('is_active', (bool) $request->validated('is_active'));
        }

        $total = (int) StockBalance::query()->whereIn('product_id', (clone $query)->select('id'))->sum('stock_value');

        $page = $query->with(['category', 'unit', 'stockBalance'])->orderBy('name')->orderBy('id')->paginate(ApiPaginator::perPage($request));
        $body = ApiPaginator::respond($page, StockValueResource::class, $request)->getData(true);
        $body['totals'] = ['stock_value' => $total];

        return response()->json($body);
    }

    /** GET /reports/cost-history — purchase prices and the average cost after each (optional ?product_id=). Owner/Finance. */
    public function costHistory(CostHistoryRequest $request): JsonResponse
    {
        return $this->costHistoryList($request, $request->validated('product_id'));
    }

    /** GET /products/{product}/cost-history — the same list for one product ("Riwayat Harga Modal"). Owner/Finance. */
    public function productCostHistory(CostHistoryRequest $request, Product $product): JsonResponse
    {
        return $this->costHistoryList($request, $product->id);
    }

    private function costHistoryList(CostHistoryRequest $request, ?int $productId): JsonResponse
    {
        $query = StockMovement::query()->whereIn('type', [MovementType::Opening->value, MovementType::PurchaseIn->value]);
        if ($productId) {
            $query->where('product_id', $productId);
        }
        if ($from = $request->validated('date_from')) {
            $query->whereDate('movement_date', '>=', $from);
        }
        if ($to = $request->validated('date_to')) {
            $query->whereDate('movement_date', '<=', $to);
        }

        $query->with(CostHistoryResource::RELATIONS)->withExists('reversedBy as reversed')->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), CostHistoryResource::class, $request);
    }
}
