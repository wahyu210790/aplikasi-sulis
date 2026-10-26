<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.13 — THE LEDGER. Append-only: rows are never updated or deleted.
// purchase_item_id / stock_opname_item_id: plain indexed columns because their tables are
// created in later migrations (purchase_items in T3.03, stock_opname_items in Fase 5).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->string('type', 30)->index();
            $table->decimal('qty_change', 15, 3);
            $table->bigInteger('value_change');
            $table->decimal('unit_cost', 18, 4);
            $table->decimal('qty_after', 15, 3);
            $table->bigInteger('value_after');
            $table->decimal('avg_cost_after', 18, 4);
            $table->foreignId('project_id')->nullable()->constrained('projects')->restrictOnDelete();
            $table->foreignId('stock_transaction_id')->nullable()->index()->constrained('stock_transactions')->restrictOnDelete();
            $table->unsignedBigInteger('purchase_item_id')->nullable()->index();
            $table->unsignedBigInteger('stock_opname_item_id')->nullable()->index();
            $table->foreignId('reverses_movement_id')->nullable()->unique()->constrained('stock_movements')->restrictOnDelete();
            $table->date('movement_date')->index();
            $table->string('notes', 500)->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('created_at')->nullable();

            $table->index(['product_id', 'id']);
            $table->index(['project_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
