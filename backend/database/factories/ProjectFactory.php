<?php

namespace Database\Factories;

use App\Models\Project;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Project>
 */
class ProjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->regexify('[A-Z]{3}[0-9]{4}'),
            'name' => $this->faker->words(3, true),
            'status' => $this->faker->randomElement(['draft', 'active', 'completed', 'cancelled']),
            'customer_name' => $this->faker->company,
            'start_date' => $this->faker->date(),
            'end_date' => $this->faker->date(),
            'revenue' => $this->faker->optional()->randomFloat(2, 1000, 100000),
            'is_active' => true,
        ];
    }
}
