<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        // Owner user
        \App\Models\User::factory()->create([
            'name' => 'Owner User',
            'email' => 'owner@example.com',
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);

        // Warehouse user
        \App\Models\User::factory()->create([
            'name' => 'Warehouse User',
            'email' => 'warehouse@example.com',
            'password' => bcrypt('password'),
            'role' => 'warehouse',
        ]);

        // Finance user
        \App\Models\User::factory()->create([
            'name' => 'Finance User',
            'email' => 'finance@example.com',
            'password' => bcrypt('password'),
            'role' => 'finance',
        ]);
    }
}
