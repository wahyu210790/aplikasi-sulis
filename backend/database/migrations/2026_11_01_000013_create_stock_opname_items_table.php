<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.15 — counted products of an opname. system_qty is a snapshot for display and is
// recomputed at posting; diff_qty is only set at posting. No money columns.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_opname_id')->constrained('stock_opnames')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('system_qty', 15, 3);
            $table->decimal('counted_qty', 15, 3)->nullable();
            $table->decimal('diff_qty', 15, 3)->nullable();
            $table->string('notes', 300)->nullable();
            $table->timestamps();

            $table->unique(['stock_opname_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
    }
};
