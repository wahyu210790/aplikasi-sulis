<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\ListCategoriesRequest;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\AuditLogger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(ListCategoriesRequest $request): JsonResponse
    {
        $query = Category::query();

        if ($search = $request->validated('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        // ?all=1 -> active items only, no pagination (for dropdowns)
        if ($request->validated('all') === '1') {
            $items = $query->where('is_active', true)->orderBy('name')->limit(ApiPaginator::MAX_ALL)->get();

            return ApiPaginator::all($items, CategoryResource::class, $request);
        }

        if ($request->validated('is_active') !== null) {
            $query->where('is_active', (bool) $request->validated('is_active'));
        }

        $query->orderBy('name')->orderBy('id');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), CategoryResource::class, $request);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = DB::transaction(function () use ($request) {
            $category = Category::create(['name' => $request->validated('name'), 'is_active' => true]);

            $this->audit->log(AuditAction::CATEGORY_CREATED, $category, "Menambah kategori {$category->name}", null, $this->snapshot($category));

            return $category;
        });

        return response()->json(['data' => (new CategoryResource($category))->resolve($request)], 201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        DB::transaction(function () use ($request, $category) {
            $before = $this->snapshot($category);

            $category->fill([
                'name' => $request->validated('name'),
                'is_active' => (bool) $request->validated('is_active'),
            ])->save();

            $after = $this->snapshot($category);

            if ($before !== $after) {
                $this->audit->log(AuditAction::CATEGORY_UPDATED, $category, AuditLogger::editVerb($before, $after)." kategori {$category->name}", $before, $after);
            }
        });

        return response()->json(['data' => (new CategoryResource($category->fresh()))->resolve($request)]);
    }

    private function snapshot(Category $category): array
    {
        return ['name' => $category->name, 'is_active' => $category->is_active];
    }
}
