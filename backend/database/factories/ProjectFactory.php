<?php

namespace Database\Factories;

use App\Enums\ProjectStatus;
use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => 'PRJ-T'.fake()->unique()->numerify('####'),
            'name' => 'Proyek '.fake()->unique()->numerify('####'),
            'client_name' => null,
            'location' => null,
            'contract_value' => 0,
            'start_date' => null,
            'end_date' => null,
            'status' => ProjectStatus::Aktif,
            'notes' => null,
            'created_by' => User::factory()->owner(),
        ];
    }

    public function status(ProjectStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
