<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Str;

class SupplierController extends Controller
{
    /**
     * Hanya owner dan finance yang boleh melakukan mutasi data supplier.
     * Warehouse tidak boleh membuat, mengubah, atau menghapus supplier.
     */
    private function authorizeMutation(Request $request): ?Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['owner', 'finance'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    /**
     * Generate kode supplier unik. Prefix SUP- diikuti 6 karakter acak uppercase.
     * Percobaan hingga 10 kali untuk menghindari collision.
     */
    private function generateUniqueCode(): string
    {
        for ($i = 0; $i < 10; $i++) {
            $code = 'SUP-' . strtoupper(substr(uniqid(), -6));
            if (!Supplier::where('code', $code)->exists()) {
                return $code;
            }
        }
        return 'SUP-' . strtoupper(Str::random(8));
    }

    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
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
            'name'    => 'required|string|max:255',
            'code'    => 'nullable|string|max:100|unique:suppliers,code',
            'email'   => 'nullable|email|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);

        // Auto-generate kode jika tidak disediakan
        if (empty($data['code'])) {
            $data['code'] = $this->generateUniqueCode();
        }

        $supplier = Supplier::create($data);
        return response()->json($supplier, Response::HTTP_CREATED);
    }

    public function show($id)
    {
        return response()->json(Supplier::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        if ($res = $this->authorizeMutation($request)) return $res;

        $supplier = Supplier::findOrFail($id);
        $data = $request->validate([
            'name'    => 'sometimes|required|string|max:255',
            'code'    => 'sometimes|required|string|max:100|unique:suppliers,code,' . $id,
            'email'   => 'nullable|email|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);
        $supplier->update($data);
        return response()->json($supplier);
    }

    public function destroy(Request $request, $id)
    {
        if ($res = $this->authorizeMutation($request)) return $res;

        $supplier = Supplier::findOrFail($id);
        $supplier->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
