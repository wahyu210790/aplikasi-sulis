<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ProjectProfitReportRequest;
use App\Models\Product;
use App\Models\Project;
use App\Services\ProjectProfitService;
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
}
