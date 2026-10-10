<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SupplierController extends Controller
{
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
        $data = $request->validate([
            'name'    => 'required|string|max:255',
            'code'    => 'nullable|string|max:100|unique:suppliers,code',
            'email'   => 'nullable|email|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string',
        ]);
        if (empty($data['code'])) {
            $data['code'] = 'SUP-' . strtoupper(substr(uniqid(), -6));
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

    public function destroy($id)
    {
        $supplier = Supplier::findOrFail($id);
        $supplier->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
