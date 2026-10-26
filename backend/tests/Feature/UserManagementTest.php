<?php

namespace Tests\Feature;

use App\Enums\Role;
use App\Models\AuditLog;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->owner()->create(['name' => 'Pak Owner', 'email' => 'owner@sulis.test']);
        Sanctum::actingAs($this->owner);
    }

    public function test_list_users_uses_standard_envelope(): void
    {
        User::factory()->count(3)->gudang()->create();

        $this->getJson('/api/v1/users?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonPath('meta.current_page', 1)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonMissingPath('links')
            ->assertJsonMissingPath('data.0.password');
    }

    public function test_list_users_filters_by_role_and_search(): void
    {
        User::factory()->finance()->create(['name' => 'Bu Finance']);
        User::factory()->gudang()->create(['name' => 'Andi Gudang']);

        $this->getJson('/api/v1/users?role=gudang')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Andi Gudang');
        $this->getJson('/api/v1/users?search=finance')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_create_user(): void
    {
        $this->postJson('/api/v1/users', [
            'name' => 'Andi',
            'email' => 'Andi@Sulis.test',
            'role' => 'gudang',
            'password' => 'Gudang123',
        ])->assertCreated()
            ->assertJsonPath('data.email', 'andi@sulis.test')
            ->assertJsonPath('data.role', 'gudang')
            ->assertJsonPath('data.is_active', true);

        $user = User::where('email', 'andi@sulis.test')->first();
        $this->assertTrue(Hash::check('Gudang123', $user->password));
        $this->assertTrue(AuditLog::where('action', AuditAction::USER_CREATED)->where('subject_id', $user->id)->exists());
    }

    public function test_create_user_validation_messages_are_indonesian(): void
    {
        User::factory()->create(['email' => 'ada@sulis.test']);

        $this->postJson('/api/v1/users', ['name' => '', 'email' => 'ada@sulis.test', 'role' => 'admin', 'password' => 'pendek'])
            ->assertStatus(422)
            ->assertJsonPath('errors.name.0', 'Nama wajib diisi.')
            ->assertJsonPath('errors.email.0', 'Email sudah digunakan.')
            ->assertJsonPath('errors.role.0', 'Peran yang dipilih tidak valid.')
            ->assertJsonPath('errors.password.0', 'Password minimal 8 karakter.');
    }

    public function test_update_user(): void
    {
        $user = User::factory()->gudang()->create();

        $this->putJson("/api/v1/users/{$user->id}", [
            'name' => 'Nama Baru',
            'email' => $user->email,
            'role' => 'finance',
            'is_active' => true,
        ])->assertOk()->assertJsonPath('data.name', 'Nama Baru')->assertJsonPath('data.role', 'finance');

        $log = AuditLog::where('action', AuditAction::USER_UPDATED)->first();
        $this->assertSame('gudang', $log->changes['before']['role']);
        $this->assertSame('finance', $log->changes['after']['role']);
    }

    public function test_deactivating_user_revokes_tokens_and_is_logged(): void
    {
        $user = User::factory()->gudang()->create();
        $user->createToken('spa');

        $this->putJson("/api/v1/users/{$user->id}", [
            'name' => $user->name, 'email' => $user->email, 'role' => 'gudang', 'is_active' => false,
        ])->assertOk()->assertJsonPath('data.is_active', false);

        $this->assertSame(0, $user->tokens()->count());
        $this->assertTrue(AuditLog::where('action', AuditAction::USER_DEACTIVATED)->exists());
        $this->assertFalse(AuditLog::where('action', AuditAction::USER_UPDATED)->exists());
    }

    public function test_cannot_change_own_role_or_deactivate_self(): void
    {
        User::factory()->owner()->create(); // second owner, so only the self-rule applies

        $this->putJson("/api/v1/users/{$this->owner->id}", [
            'name' => 'Pak Owner', 'email' => 'owner@sulis.test', 'role' => 'finance', 'is_active' => true,
        ])->assertStatus(422)->assertExactJson(['message' => 'Anda tidak bisa menonaktifkan atau mengubah peran akun Anda sendiri.']);

        $this->putJson("/api/v1/users/{$this->owner->id}", [
            'name' => 'Pak Owner', 'email' => 'owner@sulis.test', 'role' => 'owner', 'is_active' => false,
        ])->assertStatus(422);
    }

    public function test_owner_can_edit_own_name(): void
    {
        $this->putJson("/api/v1/users/{$this->owner->id}", [
            'name' => 'Pak Owner Baru', 'email' => 'owner@sulis.test', 'role' => 'owner', 'is_active' => true,
        ])->assertOk()->assertJsonPath('data.name', 'Pak Owner Baru');
    }

    public function test_owner_can_deactivate_another_owner(): void
    {
        $second = User::factory()->owner()->create();

        $this->putJson("/api/v1/users/{$second->id}", [
            'name' => $second->name, 'email' => $second->email, 'role' => 'owner', 'is_active' => false,
        ])->assertOk()->assertJsonPath('data.is_active', false);

        $this->assertSame(1, User::where('role', Role::Owner)->where('is_active', true)->count());
    }

    public function test_reset_password_returns_temporary_password_and_revokes_tokens(): void
    {
        $user = User::factory()->gudang()->create();
        $user->createToken('spa');

        $temp = $this->postJson("/api/v1/users/{$user->id}/reset-password")
            ->assertOk()
            ->json('data.temporary_password');

        $this->assertSame(12, strlen($temp));
        $this->assertMatchesRegularExpression('/[A-Za-z]/', $temp);
        $this->assertMatchesRegularExpression('/\d/', $temp);
        $this->assertTrue(Hash::check($temp, $user->fresh()->password));
        $this->assertSame(0, $user->tokens()->count());
        $this->assertTrue(AuditLog::where('action', AuditAction::USER_PASSWORD_RESET)->exists());
        $this->assertStringNotContainsString($temp, AuditLog::all()->toJson());
    }

    public function test_unknown_user_returns_404(): void
    {
        $this->putJson('/api/v1/users/99999', [
            'name' => 'X', 'email' => 'x@sulis.test', 'role' => 'gudang', 'is_active' => true,
        ])->assertStatus(404)->assertExactJson(['message' => 'Data tidak ditemukan.']);
    }

    public function test_non_owner_gets_403(): void
    {
        Sanctum::actingAs(User::factory()->finance()->create());
        $this->getJson('/api/v1/users')->assertStatus(403);

        Sanctum::actingAs(User::factory()->gudang()->create());
        $this->postJson('/api/v1/users', [])->assertStatus(403);
    }
}
