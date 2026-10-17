<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Hanya owner dan finance yang boleh mengakses dan memutasi proyek.
     * Warehouse tidak boleh mengakses proyek sama sekali.
     */
    private function authorizeProject(Request $request): ?Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['owner', 'finance'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    /**
     * Generate kode proyek unik. Prefix PRJ- diikuti 6 karakter acak uppercase.
     * Percobaan hingga 10 kali untuk menghindari collision.
     */
    private function generateUniqueCode(): string
    {
        for ($i = 0; $i < 10; $i++) {
            $code = 'PRJ-' . strtoupper(substr(uniqid(), -6));
            if (!Project::where('code', $code)->exists()) {
                return $code;
            }
        }
        return 'PRJ-' . strtoupper(Str::random(8));
    }

    public function index(Request $request)
    {
        if ($res = $this->authorizeProject($request)) return $res;

        $query = Project::with('expenses');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $sort = in_array($request->input('sort'), ['name', 'status', 'revenue', 'created_at']) ? $request->input('sort') : 'name';
        $direction = strtolower($request->input('direction')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        if ($res = $this->authorizeProject($request)) return $res;

        if ($request->has('status') && is_string($request->status)) {
            $request->merge(['status' => strtolower($request->status)]);
        }

        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'code'        => 'nullable|string|max:100|unique:projects,code',
            'status'      => 'nullable|string|in:draft,active,completed,cancelled',
            'revenue'     => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);

        // Auto-generate kode jika tidak disediakan
        if (empty($data['code'])) {
            $data['code'] = $this->generateUniqueCode();
        }

        // Default status adalah 'draft' jika tidak diisi
        if (empty($data['status'])) {
            $data['status'] = 'draft';
        }

        $project = Project::create($data);
        return response()->json($project, Response::HTTP_CREATED);
    }

    public function show(Request $request, $id)
    {
        if ($res = $this->authorizeProject($request)) return $res;
        $project = Project::with('expenses')->findOrFail($id);
        return response()->json($project);
    }

    public function update(Request $request, $id)
    {
        if ($res = $this->authorizeProject($request)) return $res;

        if ($request->has('status') && is_string($request->status)) {
            $request->merge(['status' => strtolower($request->status)]);
        }

        $project = Project::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'code'        => 'nullable|string|max:100|unique:projects,code,' . $id,
            'status'      => 'nullable|string|in:draft,active,completed,cancelled',
            'revenue'     => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);
        $project->update($data);
        return response()->json($project);
    }

    public function destroy(Request $request, $id)
    {
        if ($res = $this->authorizeProject($request)) return $res;
        $project = Project::findOrFail($id);
        $project->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
