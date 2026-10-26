<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\ProjectCost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProjectCost>
 */
class ProjectCostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'project_id' => Project::factory(),
            'cost_date' => now()->toDateString(),
            'description' => 'Biaya '.fake()->unique()->numerify('####'),
            'amount' => 100000,
            'created_by' => User::factory()->finance(),
            'updated_by' => null,
        ];
    }
}
