<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sku' => 'BRG-'.fake()->unique()->numerify('#####'),
            'name' => 'Barang '.fake()->unique()->numerify('####'),
            'category_id' => Category::factory(),
            'unit_id' => Unit::factory(),
            'min_stock' => '0',
            'notes' => null,
            'is_active' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
