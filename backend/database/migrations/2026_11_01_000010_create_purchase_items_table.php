<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.11 — purchase lines. Cascade delete: only drafts can be deleted.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->restrictOnDelete();
            $table->decimal('qty', 15, 3);
            $table->unsignedBigInteger('unit_price');
            $table->unsignedBigInteger('line_total');
            $table->timestamps();

            $table->unique(['purchase_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
    }
};
