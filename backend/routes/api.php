<?php

Route::get('/', function () {
    return response('OK', 200);
});
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\InventoryTransactionController;
use App\Http\Controllers\InventoryStockController;
use App\Http\Controllers\InventoryMovementController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\StockOpnameController;

// Authentication routes
Route::post('v1/auth/login', [AuthController::class, 'login']);
Route::post('v1/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('v1/auth/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

// Protected master data routes
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('v1/categories', CategoryController::class);
    Route::apiResource('v1/units', UnitController::class);
    Route::apiResource('v1/products', ProductController::class);
    Route::apiResource('v1/suppliers', SupplierController::class);
    Route::apiResource('v1/projects', ProjectController::class);

    // Inventory read endpoints
    Route::get('v1/inventory/stocks', [InventoryStockController::class, 'index']);
    Route::get('v1/inventory/stocks/{product}', [InventoryStockController::class, 'show']);
    Route::get('v1/inventory/products/{product}/movements', [InventoryMovementController::class, 'index']);

    // Inventory transaction endpoints
    Route::post('v1/inventory/purchase-in', [InventoryTransactionController::class, 'purchaseIn']);
    Route::post('v1/inventory/project-usage', [InventoryTransactionController::class, 'projectUsage']);
    Route::post('v1/inventory/stock-out', [InventoryTransactionController::class, 'stockOut']);
    Route::post('v1/inventory/adjustment-in', [InventoryTransactionController::class, 'adjustmentIn']);
    // Purchase routes
    Route::apiResource('v1/purchases', PurchaseController::class)->except(['create','edit']);
    Route::post('v1/purchases/{purchase}/confirm', [PurchaseController::class, 'confirm']);
    Route::post('v1/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel']);
    Route::post('v1/inventory/adjustment-out', [InventoryTransactionController::class, 'adjustmentOut']);
    // Project profitability routes
    Route::get('v1/projects/{project}/profitability', [App\Http\Controllers\ProjectProfitabilityController::class, 'show']);
    Route::get('v1/projects/{project}/expenses', [App\Http\Controllers\ProjectProfitabilityController::class, 'indexExpenses']);
    Route::post('v1/projects/{project}/expenses', [App\Http\Controllers\ProjectProfitabilityController::class, 'storeExpense']);
    Route::get('v1/projects/{project}/expenses/{expense}', [App\Http\Controllers\ProjectProfitabilityController::class, 'showExpense']);
    Route::put('v1/projects/{project}/expenses/{expense}', [App\Http\Controllers\ProjectProfitabilityController::class, 'updateExpense']);
    Route::delete('v1/projects/{project}/expenses/{expense}', [App\Http\Controllers\ProjectProfitabilityController::class, 'destroyExpense']);
        // Stock Opname routes
        Route::apiResource('v1/stock-opnames', StockOpnameController::class)->except(['create','edit']);
        Route::post('v1/stock-opnames/{stockOpname}/items', [StockOpnameController::class, 'addItem']);
        Route::put('v1/stock-opnames/{stockOpname}/items/{item}', [StockOpnameController::class, 'updateItem']);
        Route::delete('v1/stock-opnames/{stockOpname}/items/{item}', [StockOpnameController::class, 'deleteItem']);
        Route::post('v1/stock-opnames/{stockOpname}/complete', [StockOpnameController::class, 'complete']);
        Route::post('v1/stock-opnames/{stockOpname}/cancel', [StockOpnameController::class, 'cancel']);
        // Reporting routes
        Route::get('v1/reports/inventory-summary', [App\Http\Controllers\ReportController::class, 'inventorySummary']);
        Route::get('v1/reports/stock-movements', [App\Http\Controllers\ReportController::class, 'stockMovements']);
        Route::get('v1/reports/purchase-summary', [App\Http\Controllers\ReportController::class, 'purchaseSummary']);
        Route::get('v1/reports/project-profitability', [App\Http\Controllers\ReportController::class, 'projectProfitability']);
        Route::get('v1/reports/financial-overview', [App\Http\Controllers\ReportController::class, 'financialOverview']);
        Route::get('v1/reports/projects/{project}/cost-detail', [App\Http\Controllers\ReportController::class, 'projectCostDetail']);
        // Dashboard routes
        Route::get('v1/dashboard/owner', [App\Http\Controllers\DashboardController::class, 'owner']);
        Route::get('v1/dashboard/warehouse', [App\Http\Controllers\DashboardController::class, 'warehouse']);
        Route::get('v1/dashboard/finance', [App\Http\Controllers\DashboardController::class, 'finance']);
});

