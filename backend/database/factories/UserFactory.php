<?php

namespace Database\Factories;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('Password123'),
            'role' => Role::Gudang,
            'is_active' => true,
            'last_login_at' => null,
        ];
    }

    public function owner(): static
    {
        return $this->state(fn () => ['role' => Role::Owner]);
    }

    public function gudang(): static
    {
        return $this->state(fn () => ['role' => Role::Gudang]);
    }

    public function finance(): static
    {
        return $this->state(fn () => ['role' => Role::Finance]);
    }

    public function inactive(): static
    {
        return $this->state(fn () => ['is_active' => false]);
    }
}
