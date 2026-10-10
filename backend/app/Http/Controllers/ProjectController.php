<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProjectController extends Controller
{
    private function authorizeProject(Request $request)
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['owner', 'finance'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        return null;
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
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'status'      => 'nullable|string|max:50',
            'revenue'     => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
        ]);
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
        $project = Project::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'status'      => 'nullable|string|max:50',
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
