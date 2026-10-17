<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Hanya owner dan warehouse yang boleh melakukan mutasi kategori.
     * Finance tidak boleh membuat, mengubah, atau menghapus kategori.
     */
    private function authorizeMutation(Request $request): ?Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['owner', 'warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    /**
     * Generate kode kategori unik. Menggunakan prefix CAT- diikuti 6 karakter acak uppercase.
     * Percobaan hingga 10 kali untuk menghindari collision.
     */
    private function generateUniqueCode(): string
    {
        for ($i = 0; $i < 10; $i++) {
            $code = 'CAT-' . strtoupper(substr(uniqid(), -6));
            if (!Category::where('code', $code)->exists()) {
                return $code;
            }
        }
        // Fallback: gunakan random string lebih panjang
        return 'CAT-' . strtoupper(Str::random(8));
    }

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
        if ($res = $this->authorizeMutation($request)) return $res;

        $data = $request->validate([
            'name'        => 'required|string|max:255|unique:categories,name',
            'code'        => 'nullable|string|max:100|unique:categories,code',
            'description' => 'nullable|string',
        ]);

        // Auto-generate kode jika tidak disediakan
        if (empty($data['code'])) {
            $data['code'] = $this->generateUniqueCode();
        }

        $category = Category::create($data);
        return response()->json($category, Response::HTTP_CREATED);
    }

    public function show($id)
    {
        return response()->json(Category::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        if ($res = $this->authorizeMutation($request)) return $res;

        $category = Category::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:255|unique:categories,name,' . $id,
            'code'        => 'nullable|string|max:100|unique:categories,code,' . $id,
            'description' => 'nullable|string',
        ]);
        $category->update($data);
        return response()->json($category);
    }

    public function destroy(Request $request, $id)
    {
        if ($res = $this->authorizeMutation($request)) return $res;

        $category = Category::findOrFail($id);
        $category->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
