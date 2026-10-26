<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Project\ListProjectsRequest;
use App\Http\Requests\Project\StoreProjectRequest;
use App\Http\Requests\Project\UpdateProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Models\Project;
use App\Services\AuditLogger;
use App\Services\ProjectProfitService;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(ListProjectsRequest $request): JsonResponse
    {
        $query = Project::query()->with('creator');

        if ($search = $request->validated('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('client_name', 'like', "%{$search}%");
            });
        }

        // ?all=1 -> dropdown list, no pagination. Default: only status "aktif".
        if ($request->validated('all') === '1') {
            $items = $query->where('status', $request->validated('status') ?? ProjectStatus::Aktif->value)
                ->orderBy('code')->limit(ApiPaginator::MAX_ALL)->get();

            return ApiPaginator::all($items, ProjectResource::class, $request);
        }

        if ($status = $request->validated('status')) {
            $query->where('status', $status);
        }

        $query->orderBy($request->validated('sort') ?? 'created_at', $request->validated('direction') ?? 'desc')
            ->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), ProjectResource::class, $request);
    }

    public function show(Request $request, Project $project, ProjectProfitService $profit): JsonResponse
    {
        $project->load('creator');
        $resource = new ProjectResource($project);

        // Profit summary (B4.6) only for Owner/Finance: Gudang never gets money (B7).
        if ($request->user()->canSeeMoney()) {
            $resource->withSummary($profit->summary($project));
        }

        return response()->json(['data' => $resource->resolve($request)]);
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = DB::transaction(function () use ($request) {
            $code = $request->validated('code');

            $project = Project::create([
                // Temporary unique code; replaced below with PRJ-{id} when no code was given.
                'code' => $code ?? 'TMP-'.Str::upper(Str::random(20)),
                'name' => $request->validated('name'),
                'client_name' => $request->validated('client_name'),
                'location' => $request->validated('location'),
                'contract_value' => (int) $request->validated('contract_value'),
                'start_date' => $request->validated('start_date'),
                'end_date' => $request->validated('end_date'),
                'status' => ProjectStatus::Aktif,
                'notes' => $request->validated('notes'),
                'created_by' => $request->user()->id,
            ]);

            if ($code === null) {
                $project->code = $this->autoCode($project->id);
                $project->save();
            }

            $this->audit->log(AuditAction::PROJECT_CREATED, $project, "Menambah proyek {$project->code} {$project->name}", null, $this->snapshot($project));

            return $project;
        });

        $project->load('creator');

        return response()->json(['data' => (new ProjectResource($project))->resolve($request)], 201);
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        DB::transaction(function () use ($request, $project) {
            $before = $this->snapshot($project);
            $oldStatus = $project->status;

            $project->fill([
                'code' => $request->validated('code'),
                'name' => $request->validated('name'),
                'client_name' => $request->validated('client_name'),
                'location' => $request->validated('location'),
                'contract_value' => (int) $request->validated('contract_value'),
                'start_date' => $request->validated('start_date'),
                'end_date' => $request->validated('end_date'),
                'status' => ProjectStatus::from($request->validated('status')),
                'notes' => $request->validated('notes'),
            ])->save();

            $after = $this->snapshot($project->fresh());

            // Status change has its own audit action; other field changes are "project.updated".
            if ($oldStatus !== $project->status) {
                $this->audit->log(
                    AuditAction::PROJECT_STATUS_CHANGED,
                    $project,
                    "Mengubah status proyek {$project->code}: {$oldStatus->label()} → {$project->status->label()}",
                    ['status' => $oldStatus->value],
                    ['status' => $project->status->value],
                );
            }

            unset($before['status'], $after['status']);
            if ($before !== $after) {
                $this->audit->log(AuditAction::PROJECT_UPDATED, $project, "Mengubah proyek {$project->code} {$project->name}", $before, $after);
            }
        });

        $project = $project->fresh('creator');

        return response()->json(['data' => (new ProjectResource($project))->resolve($request)]);
    }

    /** PRJ- + id padded to 4 digits. If a user already typed that code, add -2, -3, ... */
    private function autoCode(int $id): string
    {
        $base = 'PRJ-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
        $code = $base;
        $n = 2;

        while (Project::whereRaw('LOWER(code) = ?', [mb_strtolower($code)])->exists()) {
            $code = $base.'-'.$n;
            $n++;
        }

        return $code;
    }

    private function snapshot(Project $project): array
    {
        return [
            'code' => $project->code,
            'name' => $project->name,
            'client_name' => $project->client_name,
            'location' => $project->location,
            'contract_value' => $project->contract_value,
            'start_date' => $project->start_date?->toDateString(),
            'end_date' => $project->end_date?->toDateString(),
            'status' => $project->status->value,
            'notes' => $project->notes,
        ];
    }
}
