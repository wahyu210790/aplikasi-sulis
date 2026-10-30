<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\ListProductsRequest;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\AuditLogger;
use App\Support\ApiPaginator;
use App\Support\AuditAction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(ListProductsRequest $request): JsonResponse
    {
        $query = Product::query()->with(['category', 'unit', 'stockBalance']);

        if ($search = $request->validated('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")->orWhere('name', 'like', "%{$search}%");
            });
        }
        if ($categoryId = $request->validated('category_id')) {
            $query->where('category_id', $categoryId);
        }
        if ($request->validated('is_active') !== null) {
            $query->where('is_active', (bool) $request->validated('is_active'));
        }
        if ($request->validated('low_stock') === '1') {
            $query->where('min_stock', '>', 0)
                ->whereHas('stockBalance', fn ($q) => $q->whereColumn('stock_balances.qty', '<=', 'products.min_stock'));
        }

        $query->orderBy($request->validated('sort') ?? 'name', $request->validated('direction') ?? 'asc')
            ->orderBy('id');

        return ApiPaginator::respond($query->paginate(ApiPaginator::perPage($request)), ProductResource::class, $request);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $product->load(['category', 'unit', 'stockBalance']);

        return response()->json(['data' => (new ProductResource($product))->resolve($request)]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = DB::transaction(function () use ($request) {
            $product = Product::create([
                'sku' => $request->validated('sku'),
                'name' => $request->validated('name'),
                'category_id' => $request->validated('category_id'),
                'unit_id' => $request->validated('unit_id'),
                'min_stock' => (string) $request->validated('min_stock'),
                'notes' => $request->validated('notes'),
                'is_active' => true,
            ]);

            $this->audit->log(AuditAction::PRODUCT_CREATED, $product, "Menambah barang {$product->sku} {$product->name}", null, $this->snapshot($product));

            return $product;
        });

        $product->load(['category', 'unit', 'stockBalance']);

        return response()->json(['data' => (new ProductResource($product))->resolve($request)], 201);
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        DB::transaction(function () use ($request, $product) {
            $before = $this->snapshot($product);

            $product->fill([
                'sku' => $request->validated('sku'),
                'name' => $request->validated('name'),
                'category_id' => $request->validated('category_id'),
                'unit_id' => $request->validated('unit_id'),
                'min_stock' => (string) $request->validated('min_stock'),
                'notes' => $request->validated('notes'),
                'is_active' => (bool) $request->validated('is_active'),
            ])->save();

            $after = $this->snapshot($product->fresh());

            if ($before !== $after) {
                $this->audit->log(AuditAction::PRODUCT_UPDATED, $product, AuditLogger::editVerb($before, $after)." barang {$product->sku} {$product->name}", $before, $after);
            }
        });

        $product = $product->fresh(['category', 'unit', 'stockBalance']);

        return response()->json(['data' => (new ProductResource($product))->resolve($request)]);
    }

    private function snapshot(Product $product): array
    {
        return [
            'sku' => $product->sku,
            'name' => $product->name,
            'category_id' => $product->category_id,
            'unit_id' => $product->unit_id,
            'min_stock' => $product->min_stock,
            'notes' => $product->notes,
            'is_active' => $product->is_active,
        ];
    }
}
