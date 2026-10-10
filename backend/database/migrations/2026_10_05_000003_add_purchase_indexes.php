<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add index to supplier_id and created_by for faster lookups (already foreign keys create indexes)
        Schema::table('purchases', function (Blueprint $table) {
            $table->index('supplier_id');
            $table->index('created_by');
        });
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->index('purchase_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropIndex(['supplier_id']);
            $table->dropIndex(['created_by']);
        });
        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropIndex(['purchase_id']);
            $table->dropIndex(['product_id']);
        });
    }
};
?>
