<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ProjectCost\ListProjectCostsRequest;
use App\Http\Requests\ProjectCost\StoreProjectCostRequest;
use App\Http\Requests\ProjectCost\UpdateProjectCostRequest;
use App\Http\Resources\ProjectCostResource;
use App\Models\Project;
use App\Models\ProjectCost;
use App\Services\AuditLogger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * Other project costs (docs/desain-v2.md B3.9, B9.2): Owner and Finance only (B6).
 * Routes use scoped bindings: a cost of another project gives 404.
 * Every change writes an audit entry inside the same transaction (B8).
 */
class ProjectCostController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(ListProjectCostsRequest $request, Project $project): JsonResponse
    {
        $query = $project->costs()->with(['creator', 'updater'])->orderBy('cost_date', 'desc')->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), ProjectCostResource::class, $request);
    }

    public function store(StoreProjectCostRequest $request, Project $project): JsonResponse
    {
        $cost = DB::transaction(function () use ($request, $project) {
            $cost = $project->costs()->create([
                'cost_date' => $request->validated('cost_date'),
                'description' => $request->validated('description'),
                'amount' => (int) $request->validated('amount'),
                'created_by' => $request->user()->id,
            ]);

            $this->audit->log(
                AuditAction::PROJECT_COST_CREATED,
                $cost,
                "Menambah biaya lain proyek {$project->code}: {$cost->description} ".self::rupiah($cost->amount),
                null,
                $this->snapshot($cost),
            );

            return $cost;
        });

        return response()->json(['data' => (new ProjectCostResource($cost->load(['creator', 'updater'])))->resolve($request)], 201);
    }

    public function update(UpdateProjectCostRequest $request, Project $project, ProjectCost $cost): JsonResponse
    {
        DB::transaction(function () use ($request, $project, $cost) {
            $before = $this->snapshot($cost);

            $cost->fill([
                'cost_date' => $request->validated('cost_date'),
                'description' => $request->validated('description'),
                'amount' => (int) $request->validated('amount'),
            ]);
            $after = $this->snapshot($cost);

            // Nothing changed: no save, no audit entry.
            if ($before === $after) {
                return;
            }

            $cost->updated_by = $request->user()->id;
            $cost->save();

            $this->audit->log(
                AuditAction::PROJECT_COST_UPDATED,
                $cost,
                "Mengubah biaya lain proyek {$project->code}: {$cost->description} ".self::rupiah($cost->amount),
                $before,
                $after,
            );
        });

        return response()->json(['data' => (new ProjectCostResource($cost->fresh(['creator', 'updater'])))->resolve($request)]);
    }

    public function destroy(Request $request, Project $project, ProjectCost $cost): Response
    {
        DB::transaction(function () use ($project, $cost) {
            $before = $this->snapshot($cost);

            $this->audit->log(
                AuditAction::PROJECT_COST_DELETED,
                $cost,
                "Menghapus biaya lain proyek {$project->code}: {$cost->description} ".self::rupiah($cost->amount),
                $before,
                null,
            );

            $cost->delete();
        });

        return response()->noContent();
    }

    /** 1500000 => "Rp 1.500.000" (for audit summaries). */
    private static function rupiah(int $amount): string
    {
        return 'Rp '.number_format($amount, 0, ',', '.');
    }

    private function snapshot(ProjectCost $cost): array
    {
        return [
            'cost_date' => $cost->cost_date?->toDateString(),
            'description' => $cost->description,
            'amount' => (int) $cost->amount,
        ];
    }
}
