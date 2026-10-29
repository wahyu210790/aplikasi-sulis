<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Audit\ListAuditLogsRequest;
use App\Http\Resources\AuditLogResource;
use App\Models\AuditLog;
use App\Support\ApiPaginator;
use Illuminate\Http\JsonResponse;

/** GET /audit-logs (docs/desain-v2.md B8): read-only, Owner only, newest first. Audit logs are never changed or deleted. */
class AuditLogController extends Controller
{
    public function index(ListAuditLogsRequest $request): JsonResponse
    {
        $query = AuditLog::query()->with('user');

        if ($userId = $request->validated('user_id')) {
            $query->where('user_id', $userId);
        }
        if ($action = $request->validated('action')) {
            // "opname" = every opname.* action; "opname.posted" = only that action.
            $query->where(fn ($q) => $q->where('action', $action)->orWhere('action', 'like', $action.'.%'));
        }
        if ($subjectType = $request->validated('subject_type')) {
            $query->where('subject_type', $subjectType);
        }
        if ($from = $request->validated('date_from')) {
            $query->where('created_at', '>=', $from.' 00:00:00');
        }
        if ($to = $request->validated('date_to')) {
            $query->where('created_at', '<=', $to.' 23:59:59');
        }

        $query->orderBy('id', 'desc');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), AuditLogResource::class, $request);
    }
}
