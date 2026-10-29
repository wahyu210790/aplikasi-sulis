<?php

namespace Database\Factories;

use App\Enums\OpnameStatus;
use App\Models\StockOpname;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * A DRAFT stock opname without items. Fill and post it through the API so stock goes through the ledger.
 *
 * @extends Factory<StockOpname>
 */
class StockOpnameFactory extends Factory
{
    public function definition(): array
    {
        return [
            'number' => 'SO-T'.fake()->unique()->numerify('######'),
            'opname_date' => now()->toDateString(),
            'status' => OpnameStatus::Draft,
            'notes' => null,
            'created_by' => User::factory()->gudang(),
        ];
    }
}
