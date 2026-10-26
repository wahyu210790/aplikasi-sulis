<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// docs/desain-v2.md B3.9 — other project costs (not material), entered by Owner/Finance. Money: hidden from Gudang.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->restrictOnDelete();
            $table->date('cost_date');
            $table->string('description', 200);
            $table->unsignedBigInteger('amount');
            $table->foreignId('created_by')->constrained('users')->restrictOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->restrictOnDelete();
            $table->timestamps();

            $table->index(['project_id', 'cost_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_costs');
    }
};
