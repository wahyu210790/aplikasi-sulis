<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware(['api', 'auth:sanctum', 'active', 'role:owner,finance'])
            ->get('/api/v1/_test/owner-finance', fn () => response()->json(['ok' => true]));
    }

    public function test_allowed_roles_pass(): void
    {
        Sanctum::actingAs(User::factory()->owner()->create());
        $this->getJson('/api/v1/_test/owner-finance')->assertOk();

        Sanctum::actingAs(User::factory()->finance()->create());
        $this->getJson('/api/v1/_test/owner-finance')->assertOk();
    }

    public function test_other_role_gets_403_indonesian(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->getJson('/api/v1/_test/owner-finance')
            ->assertStatus(403)
            ->assertExactJson(['message' => 'Anda tidak memiliki akses untuk tindakan ini.']);
    }

    public function test_guest_gets_401(): void
    {
        $this->getJson('/api/v1/_test/owner-finance')->assertStatus(401);
    }
}
