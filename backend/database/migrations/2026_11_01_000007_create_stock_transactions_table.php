<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.12 — header of a stock-out (BK-) or return (RT-) document.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('number', 30)->unique();
            $table->string('type', 20);
            $table->foreignId('project_id')->constrained('projects')->restrictOnDelete();
            $table->string('person_name', 100);
            $table->date('transaction_date')->index();
            $table->string('notes', 500)->nullable();
            $table->string('status', 20)->default('posted');
            $table->foreignId('reversed_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamp('reversed_at')->nullable();
            $table->string('reverse_reason', 300)->nullable();
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['project_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
    }
};
