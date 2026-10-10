<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
            return [
                'code' => $this->faker->unique()->bothify('???###'),
                'name' => $this->faker->company,
                'phone' => $this->faker->phoneNumber,
                'email' => $this->faker->unique()->safeEmail,
                'address' => $this->faker->address,
                'notes' => $this->faker->sentence,
                'is_active' => true,
            ];
    }
}
