<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => \App\Models\Category::factory(),
            'unit_id' => \App\Models\Unit::factory(),
            'code' => $this->faker->unique()->regexify('[A-Z]{3}[0-9]{3}'),
            'name' => $this->faker->word(),
            'description' => $this->faker->sentence(),
            'minimum_stock' => $this->faker->optional()->numberBetween(1, 10),
            'is_active' => true,
        ];
    }
}
