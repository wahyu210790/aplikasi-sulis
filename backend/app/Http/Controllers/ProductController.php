<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'unit', 'stock']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        $sort = in_array($request->input('sort'), ['name', 'code', 'price', 'created_at']) ? $request->input('sort') : 'name';
        $direction = strtolower($request->input('direction')) === 'desc' ? 'desc' : 'asc';
        $query->orderBy($sort, $direction);

        $perPage = max(1, min((int) $request->input('per_page', 15), 100));
        return response()->json($query->paginate($perPage));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'code'        => 'required|string|max:100|unique:products,code',
            'category_id' => 'nullable|exists:categories,id',
            'unit_id'     => 'nullable|exists:units,id',
            'price'       => 'nullable|numeric|min:0',
        ]);
        $product = Product::create($data);
        return response()->json($product->load(['category', 'unit']), Response::HTTP_CREATED);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'unit', 'stock'])->findOrFail($id);
        return response()->json($product);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'code'        => 'sometimes|required|string|max:100|unique:products,code,' . $id,
            'category_id' => 'nullable|exists:categories,id',
            'unit_id'     => 'nullable|exists:units,id',
            'price'       => 'nullable|numeric|min:0',
        ]);
        $product->update($data);
        return response()->json($product->load(['category', 'unit']));
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
