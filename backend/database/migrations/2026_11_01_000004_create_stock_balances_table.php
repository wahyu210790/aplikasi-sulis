<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.6 — exactly one row per product, created together with the product.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained('products')->restrictOnDelete();
            $table->decimal('qty', 15, 3)->default(0);
            $table->bigInteger('stock_value')->default(0);
            $table->decimal('avg_cost', 18, 4)->default(0);
            $table->boolean('has_cost')->default(false);
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_balances');
    }
};
