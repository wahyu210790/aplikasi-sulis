<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * LOCAL DEVELOPMENT ONLY. Never creates anything in production.
     * Password for all demo users: Password123
     */
    public function run(): void
    {
        if (app()->isProduction()) {
            return;
        }

        $users = [
            ['name' => 'Owner Demo', 'email' => 'owner@sulis.test', 'role' => Role::Owner],
            ['name' => 'Gudang Demo', 'email' => 'gudang@sulis.test', 'role' => Role::Gudang],
            ['name' => 'Finance Demo', 'email' => 'finance@sulis.test', 'role' => Role::Finance],
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                ['name' => $user['name'], 'role' => $user['role'], 'password' => 'Password123', 'is_active' => true],
            );
        }
    }
}
