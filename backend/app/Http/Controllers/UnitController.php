<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UnitController extends Controller
{
    /**
     * Mutasi satuan hanya untuk owner dan warehouse (selaras dengan Produk & Kategori).
     * Pembacaan tetap terbuka untuk semua pengguna yang terautentikasi.
     */
    private function authorizeMutation(Request $request): ?Response
    {
        $user = $request->user();
        if (!$user || !in_array($user->role, ['owner', 'warehouse'])) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }
        return null;
    }

    public function index()
    {
        return response()->json(Unit::all());
    }

    public function store(Request $request)
    {
        if ($res = $this->authorizeMutation($request)) return $res;
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50',
        ]);
        $unit = Unit::create($data);
        return response()->json($unit, Response::HTTP_CREATED);
    }

    public function show($id)
    {
        return response()->json(Unit::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        if ($res = $this->authorizeMutation($request)) return $res;
        $unit = Unit::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50',
        ]);
        $unit->update($data);
        return response()->json($unit);
    }

    public function destroy(Request $request, $id)
    {
        if ($res = $this->authorizeMutation($request)) return $res;
        $unit = Unit::findOrFail($id);
        $unit->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
