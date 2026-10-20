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
        // No-op: `revenue` is already defined in `2026_10_04_165656_create_projects_table`.
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: `revenue` is owned by `2026_10_04_165656_create_projects_table`.
    }
};
