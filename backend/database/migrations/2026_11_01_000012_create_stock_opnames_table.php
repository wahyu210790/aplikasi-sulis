<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.14 — stock opname header (SO-000001). No money columns.
// rejected_by / rejected_at / reject_reason: the last rejection by the Owner (B5.5 "back to draft, with note").
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_opnames', function (Blueprint $table) {
            $table->id();
            $table->string('number', 30)->unique();
            $table->date('opname_date')->index();
            $table->string('status', 20)->default('draft')->index();
            $table->string('notes', 500)->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('rejected_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('rejected_at')->nullable();
            $table->string('reject_reason', 300)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_opnames');
    }
};
