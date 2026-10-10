<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UnitController extends Controller
{
    public function index()
    {
        return response()->json(Unit::all());
    }

    public function store(Request $request)
    {
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
        $unit = Unit::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'code' => 'sometimes|required|string|max:50',
        ]);
        $unit->update($data);
        return response()->json($unit);
    }

    public function destroy($id)
    {
        $unit = Unit::findOrFail($id);
        $unit->delete();
        return response()->json(null, Response::HTTP_NO_CONTENT);
    }
}
