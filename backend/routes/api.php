<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ImportController;
use App\Http\Controllers\Api\V1\OpeningStockController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\ProjectController;
use App\Http\Controllers\Api\V1\PurchaseController;
use App\Http\Controllers\Api\V1\StockMovementController;
use App\Http\Controllers\Api\V1\StockOutController;
use App\Http\Controllers\Api\V1\StockReturnController;
use App\Http\Controllers\Api\V1\StockTransactionController;
use App\Http\Controllers\Api\V1\StockTransactionReversalController;
use App\Http\Controllers\Api\V1\SupplierController;
use App\Http\Controllers\Api\V1\UnitController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

// docs/desain-v2.md B9.2. Every route declares its middleware explicitly.
Route::prefix('v1')->group(function () {
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:sanctum', 'active', 'throttle:api'])->group(function () {
        Route::post('auth/logout', [AuthController::class, 'logout']);
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/password', [AuthController::class, 'changePassword']);

        Route::middleware('role:owner')->group(function () {
            Route::get('users', [UserController::class, 'index']);
            Route::post('users', [UserController::class, 'store']);
            Route::put('users/{user}', [UserController::class, 'update']);
            Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::post('stock-transactions/{stockTransaction}/reverse', [StockTransactionReversalController::class, 'store']);
        });

        // Master data: categories, units, products, projects (B6). Gudang sees them without money keys (B7).
        Route::middleware('role:owner,gudang,finance')->group(function () {
            Route::get('categories', [CategoryController::class, 'index']);
            Route::get('units', [UnitController::class, 'index']);
            Route::get('products', [ProductController::class, 'index']);
            Route::get('products/{product}', [ProductController::class, 'show']);
            Route::get('products/{product}/movements', [StockMovementController::class, 'product']);
            Route::get('reports/movements', [StockMovementController::class, 'report']);
            Route::get('projects', [ProjectController::class, 'index']);
            Route::get('projects/{project}', [ProjectController::class, 'show']);
            Route::get('projects/{project}/issued-items', [StockReturnController::class, 'issuedItems']);
            Route::get('purchases', [PurchaseController::class, 'index']);
            Route::get('purchases/{purchase}', [PurchaseController::class, 'show']);
            Route::get('stock-transactions', [StockTransactionController::class, 'index']);
            Route::get('stock-transactions/{stockTransaction}', [StockTransactionController::class, 'show']);
        });
        Route::middleware('role:owner,gudang')->group(function () {
            Route::post('categories', [CategoryController::class, 'store']);
            Route::put('categories/{category}', [CategoryController::class, 'update']);
            Route::post('units', [UnitController::class, 'store']);
            Route::put('units/{unit}', [UnitController::class, 'update']);
            Route::post('products', [ProductController::class, 'store']);
            Route::put('products/{product}', [ProductController::class, 'update']);
            Route::get('imports/products/template', [ImportController::class, 'productTemplate']);
            Route::post('imports/products', [ImportController::class, 'products'])->middleware('throttle:imports');
            Route::post('purchases/{purchase}/receive', [PurchaseController::class, 'receive']);
            Route::post('stock-outs', [StockOutController::class, 'store']);
            Route::post('stock-returns', [StockReturnController::class, 'store']);
        });

        // Suppliers, project create/update, opening stock, purchase drafts: Owner and Finance only (B6)
        Route::middleware('role:owner,finance')->group(function () {
            Route::get('suppliers', [SupplierController::class, 'index']);
            Route::post('suppliers', [SupplierController::class, 'store']);
            Route::put('suppliers/{supplier}', [SupplierController::class, 'update']);
            Route::post('projects', [ProjectController::class, 'store']);
            Route::put('projects/{project}', [ProjectController::class, 'update']);
            Route::post('opening-stocks', [OpeningStockController::class, 'store']);
            Route::get('imports/opening-stocks/template', [ImportController::class, 'openingStockTemplate']);
            Route::post('imports/opening-stocks', [ImportController::class, 'openingStocks'])->middleware('throttle:imports');
            Route::post('purchases', [PurchaseController::class, 'store']);
            Route::put('purchases/{purchase}', [PurchaseController::class, 'update']);
            Route::delete('purchases/{purchase}', [PurchaseController::class, 'destroy']);
            Route::post('purchases/{purchase}/cancel', [PurchaseController::class, 'cancel']);
        });
    });
});
