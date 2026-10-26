<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UserModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_role_is_cast_to_enum(): void
    {
        $user = User::factory()->finance()->create();

        $this->assertSame(Role::Finance, $user->fresh()->role);
        $this->assertTrue($user->is_active);
    }

    public function test_can_see_money_is_false_only_for_gudang(): void
    {
        $this->assertTrue(User::factory()->owner()->make()->canSeeMoney());
        $this->assertTrue(User::factory()->finance()->make()->canSeeMoney());
        $this->assertFalse(User::factory()->gudang()->make()->canSeeMoney());
    }

    public function test_is_owner_and_has_role(): void
    {
        $owner = User::factory()->owner()->make();

        $this->assertTrue($owner->isOwner());
        $this->assertTrue($owner->hasRole(Role::Owner, Role::Finance));
        $this->assertFalse($owner->hasRole(Role::Gudang));
    }

    public function test_role_column_has_no_default(): void
    {
        $this->expectException(QueryException::class);

        DB::table('users')->insert([
            'name' => 'Tanpa Peran',
            'email' => 'tanpa@peran.test',
            'password' => 'x',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_password_is_hidden_from_array(): void
    {
        $this->assertArrayNotHasKey('password', User::factory()->create()->toArray());
    }

    public function test_seeder_creates_three_demo_users_locally(): void
    {
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(3, User::count());
        $this->assertSame(Role::Owner, User::where('email', 'owner@sulis.test')->first()->role);
    }

    public function test_seeder_does_nothing_in_production(): void
    {
        $this->app['env'] = 'production';

        $this->app->make(DatabaseSeeder::class)->run();

        $this->assertSame(0, User::count());
    }
}
