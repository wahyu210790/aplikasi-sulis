<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.10 — purchase header. Status: draft -> diterima, or -> batal.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->string('number', 30)->unique();
            $table->foreignId('supplier_id')->constrained('suppliers')->restrictOnDelete();
            $table->date('purchase_date')->index();
            $table->string('invoice_no', 50)->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->unsignedBigInteger('total_value')->default(0);
            $table->string('notes', 500)->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('received_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('received_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->string('cancel_reason', 300)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
