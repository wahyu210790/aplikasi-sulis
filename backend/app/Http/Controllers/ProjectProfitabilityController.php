<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProjectProfitabilityController extends Controller
{
    private function authorize(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['owner', 'finance'])) {
            abort(403, 'Forbidden');
        }
    }

    public function show($id, Request $request)
    {
        $this->authorize($request);
        $project = Project::with('expenses')->findOrFail($id);
        $materialCost = \DB::table('inventory_movements')
            ->where('project_id', $project->id)
            ->where('type', 'PROJECT_USAGE')
            ->sum('total_cost');
        $otherExpenses = $project->expenses->sum('amount');
        $totalCost = $materialCost + $otherExpenses;
        $grossProfit = $project->revenue - $totalCost;
        $margin = $project->revenue > 0 ? ($grossProfit / $project->revenue) * 100 : 0;
        return response()->json([
            'id' => $project->id,
            'name' => $project->name ?? null,
            'revenue' => $project->revenue,
            'material_cost' => $materialCost,
            'other_expenses' => $otherExpenses,
            'total_cost' => $totalCost,
            'gross_profit' => $grossProfit,
            'margin_percent' => round($margin, 2),
            'expenses' => $project->expenses,
        ]);
    }

    public function indexExpenses($projectId, Request $request)
    {
        $this->authorize($request);
        $project = Project::findOrFail($projectId);
        return response()->json($project->expenses);
    }

    public function storeExpense(Request $request, $projectId)
    {
        $this->authorize($request);
        $user = $request->user();
        $project = Project::findOrFail($projectId);
        $validator = Validator::make($request->all(), [
            'description' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'notes' => 'sometimes|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $expense = ProjectExpense::create([
            'project_id' => $project->id,
            'description' => $request->description,
            'amount' => $request->amount,
            'expense_date' => $request->expense_date,
            'notes' => $request->notes,
            'created_by' => $user->id,
        ]);
        return response()->json($expense, 201);
    }

    public function showExpense($projectId, $expenseId, Request $request)
    {
        $this->authorize($request);
        $expense = ProjectExpense::where('project_id', $projectId)->findOrFail($expenseId);
        return response()->json($expense);
    }

    public function updateExpense(Request $request, $projectId, $expenseId)
    {
        $this->authorize($request);
        $expense = ProjectExpense::where('project_id', $projectId)->findOrFail($expenseId);
        $validator = Validator::make($request->all(), [
            'description' => 'sometimes|required|string',
            'amount' => 'sometimes|required|numeric|min:0',
            'expense_date' => 'sometimes|required|date',
            'notes' => 'sometimes|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $expense->update($request->only(['description', 'amount', 'expense_date', 'notes']));
        return response()->json($expense);
    }

    public function destroyExpense($projectId, $expenseId, Request $request)
    {
        $this->authorize($request);
        $expense = ProjectExpense::where('project_id', $projectId)->findOrFail($expenseId);
        $expense->delete();
        return response()->json(null, 204);
    }
}
?>
