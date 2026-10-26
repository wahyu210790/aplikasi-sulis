<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
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
        });

        // Master data: categories, units (B6)
        Route::middleware('role:owner,gudang,finance')->group(function () {
            Route::get('categories', [CategoryController::class, 'index']);
            Route::get('units', [UnitController::class, 'index']);
        });
        Route::middleware('role:owner,gudang')->group(function () {
            Route::post('categories', [CategoryController::class, 'store']);
            Route::put('categories/{category}', [CategoryController::class, 'update']);
            Route::post('units', [UnitController::class, 'store']);
            Route::put('units/{unit}', [UnitController::class, 'update']);
        });
    });
});
