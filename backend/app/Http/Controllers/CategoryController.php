<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $sort = in_array($request->input('sort'), ['name', 'code', 'created_at']) ? $request->input('sort') : 'name';
        $direction = strtolower($request->input('direction')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ]);
        $category = Category::create($data);
        return response()->json($category, Response::HTTP_CREATED);
    }

    public function show($id)
    {
        return response()->json(Category::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $category = Category::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'nullable|string|max:100',
            'description' => 'nullable|string',
        ]);
        $category->update($data);
        return response()->json($category);
    }

    public function destroy($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
