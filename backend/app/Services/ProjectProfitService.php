<?php

namespace App\Services;

use App\Enums\MovementType;
use App\Models\Project;
use App\Models\ProjectCost;
use App\Models\StockMovement;
use App\Support\Dec;

/**
 * Profit per project (docs/desain-v2.md B4.6, B4.7). Approved rule:
 *   material_cost  = −Σ value_change of all movements with this project_id
 *                    (issues at the weighted-average cost of that moment; returns and reversals reduce it)
 *   other_costs    = Σ project_costs.amount (entered by Owner/Finance)
 *   profit         = contract_value − material_cost − other_costs
 *   margin_percent = contract_value > 0 ? round(profit / contract_value × 100, 1) : null
 * All amounts are whole rupiah (int). Read-only: this service never writes anything.
 */
class ProjectProfitService
{
    /** @return array{material_cost: int, other_costs: int, profit: int, margin_percent: float|null} */
    public function summary(Project $project): array
    {
        $id = $project->id;

        return self::row(
            (int) $project->contract_value,
            $this->materialCosts([$id])[$id] ?? 0,
            $this->otherCosts([$id])[$id] ?? 0,
        );
    }

    /**
     * @param  list<int>  $projectIds
     * @return array<int, int> project_id => material cost (projects without movements are missing)
     */
    public function materialCosts(array $projectIds): array
    {
        if ($projectIds === []) {
            return [];
        }

        return StockMovement::query()
            ->whereIn('project_id', $projectIds)
            ->groupBy('project_id')
            ->selectRaw('project_id, SUM(value_change) as total')
            ->pluck('total', 'project_id')
            ->map(fn ($total) => -1 * (int) $total)
            ->all();
    }

    /**
     * @param  list<int>  $projectIds
     * @return array<int, int> project_id => sum of other costs (projects without costs are missing)
     */
    public function otherCosts(array $projectIds): array
    {
        if ($projectIds === []) {
            return [];
        }

        return ProjectCost::query()
            ->whereIn('project_id', $projectIds)
            ->groupBy('project_id')
            ->selectRaw('project_id, SUM(amount) as total')
            ->pluck('total', 'project_id')
            ->map(fn ($total) => (int) $total)
            ->all();
    }

    /** @return array{material_cost: int, other_costs: int, profit: int, margin_percent: float|null} */
    public static function row(int $contractValue, int $materialCost, int $otherCosts): array
    {
        $profit = $contractValue - $materialCost - $otherCosts;

        return [
            'material_cost' => $materialCost,
            'other_costs' => $otherCosts,
            'profit' => $profit,
            'margin_percent' => self::margin($profit, $contractValue),
        ];
    }

    /** round(profit / contract × 100, 1), or null when there is no contract value. */
    public static function margin(int $profit, int $contractValue): ?float
    {
        if ($contractValue <= 0) {
            return null;
        }

        return round($profit / $contractValue * 100, 1);
    }

    /**
     * Material per product for one project (B9.2 GET /reports/projects/{id}/materials).
     * A reversal counts with the type it cancels, so qty_out − qty_returned = net_qty always holds.
     *
     * @return list<array{product_id: int, qty_out: string, qty_returned: string, net_qty: string, net_value: int}>
     */
    public function materials(Project $project): array
    {
        $movements = StockMovement::query()
            ->where('project_id', $project->id)
            ->with('reverses:id,type')
            ->orderBy('id')
            ->get(['id', 'product_id', 'type', 'qty_change', 'value_change', 'reverses_movement_id']);

        $rows = [];
        foreach ($movements as $movement) {
            $type = $movement->type === MovementType::Reversal ? $movement->reverses?->type : $movement->type;
            $row = $rows[$movement->product_id] ?? ['product_id' => $movement->product_id, 'qty_out' => '0.000', 'qty_returned' => '0.000', 'net_qty' => '0.000', 'net_value' => 0];

            if ($type === MovementType::ProjectOut) {
                $row['qty_out'] = Dec::sub($row['qty_out'], $movement->qty_change, 3);
            } elseif ($type === MovementType::ProjectReturn) {
                $row['qty_returned'] = Dec::add($row['qty_returned'], $movement->qty_change, 3);
            }
            $row['net_qty'] = Dec::sub($row['net_qty'], $movement->qty_change, 3);
            $row['net_value'] -= $movement->value_change;
            $rows[$movement->product_id] = $row;
        }

        return array_values($rows);
    }
}
