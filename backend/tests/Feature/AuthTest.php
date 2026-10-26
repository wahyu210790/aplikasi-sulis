<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function login(string $email, string $password = 'Password123')
    {
        return $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => $password]);
    }

    private function bearer(string $token): array
    {
        return ['Authorization' => 'Bearer '.$token];
    }

    /** Clears the cached authenticated user between requests in one test. */
    private function resetAuth(): void
    {
        $this->app['auth']->forgetGuards();
    }

    public function test_login_success_returns_token_and_user(): void
    {
        $user = User::factory()->owner()->create(['email' => 'owner@sulis.test']);

        $this->login('OWNER@sulis.test ')
            ->assertOk()
            ->assertJsonStructure(['data' => ['token', 'expires_at', 'user' => ['id', 'name', 'email', 'role', 'role_label', 'is_active', 'last_login_at', 'created_at']]])
            ->assertJsonPath('data.user.id', $user->id)
            ->assertJsonPath('data.user.role', 'owner')
            ->assertJsonMissingPath('data.user.password');

        $this->assertNotNull($user->fresh()->last_login_at);
        $this->assertSame(1, $user->tokens()->count());
        $this->assertNotNull($user->tokens()->first()->expires_at);
    }

    public function test_wrong_password_returns_422_indonesian(): void
    {
        User::factory()->create(['email' => 'a@sulis.test']);

        $this->login('a@sulis.test', 'salah123')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Email atau password salah.')
            ->assertJsonPath('errors.email.0', 'Email atau password salah.');
    }

    public function test_unknown_email_returns_same_422(): void
    {
        $this->login('tidak.ada@sulis.test')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Email atau password salah.');
    }

    public function test_inactive_user_with_correct_password_gets_403(): void
    {
        User::factory()->inactive()->create(['email' => 'off@sulis.test']);

        $this->login('off@sulis.test')
            ->assertStatus(403)
            ->assertExactJson(['message' => 'Akun Anda dinonaktifkan. Hubungi Owner.']);
    }

    public function test_inactive_user_with_wrong_password_gets_422(): void
    {
        User::factory()->inactive()->create(['email' => 'off@sulis.test']);

        $this->login('off@sulis.test', 'salah123')->assertStatus(422);
    }

    public function test_login_is_throttled_after_5_attempts_per_minute(): void
    {
        User::factory()->create(['email' => 'a@sulis.test']);

        for ($i = 0; $i < 5; $i++) {
            $this->login('a@sulis.test', 'salah123')->assertStatus(422);
        }

        $response = $this->login('a@sulis.test', 'salah123')->assertStatus(429);
        $this->assertStringStartsWith('Terlalu banyak percobaan. Coba lagi dalam ', $response->json('message'));
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/v1/auth/me')
            ->assertStatus(401)
            ->assertExactJson(['message' => 'Sesi Anda telah berakhir. Silakan masuk kembali.']);
    }

    public function test_me_returns_current_user(): void
    {
        $user = User::factory()->finance()->create(['email' => 'f@sulis.test']);
        $token = $this->login('f@sulis.test')->json('data.token');
        $this->resetAuth();

        $this->getJson('/api/v1/auth/me', $this->bearer($token))
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'finance');
    }

    public function test_logout_revokes_token(): void
    {
        User::factory()->create(['email' => 'a@sulis.test']);
        $token = $this->login('a@sulis.test')->json('data.token');
        $this->resetAuth();

        $this->postJson('/api/v1/auth/logout', [], $this->bearer($token))->assertNoContent();
        $this->resetAuth();

        $this->getJson('/api/v1/auth/me', $this->bearer($token))->assertStatus(401);
    }

    public function test_token_expires_after_7_days(): void
    {
        User::factory()->create(['email' => 'a@sulis.test']);
        $token = $this->login('a@sulis.test')->json('data.token');
        $this->resetAuth();

        $this->travel(7 * 24 * 60 + 1)->minutes();

        $this->getJson('/api/v1/auth/me', $this->bearer($token))->assertStatus(401);
    }

    public function test_deactivated_user_token_is_rejected_and_deleted(): void
    {
        $user = User::factory()->create(['email' => 'a@sulis.test']);
        $token = $this->login('a@sulis.test')->json('data.token');
        $this->resetAuth();

        $user->forceFill(['is_active' => false])->save();

        $this->getJson('/api/v1/auth/me', $this->bearer($token))->assertStatus(401);
        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_change_password_keeps_current_token_and_revokes_others(): void
    {
        $user = User::factory()->create(['email' => 'a@sulis.test']);
        $other = $this->login('a@sulis.test')->json('data.token');
        $current = $this->login('a@sulis.test')->json('data.token');
        $this->resetAuth();

        $this->putJson('/api/v1/auth/password', [
            'current_password' => 'Password123',
            'password' => 'BaruSekali9',
            'password_confirmation' => 'BaruSekali9',
        ], $this->bearer($current))->assertNoContent();

        $this->assertTrue(Hash::check('BaruSekali9', $user->fresh()->password));
        $this->assertSame(1, $user->tokens()->count());
        $this->resetAuth();
        $this->getJson('/api/v1/auth/me', $this->bearer($other))->assertStatus(401);
        $this->resetAuth();
        $this->getJson('/api/v1/auth/me', $this->bearer($current))->assertOk();
    }

    public function test_change_password_wrong_current_password(): void
    {
        User::factory()->create(['email' => 'a@sulis.test']);
        $token = $this->login('a@sulis.test')->json('data.token');
        $this->resetAuth();

        $this->putJson('/api/v1/auth/password', [
            'current_password' => 'salah123',
            'password' => 'BaruSekali9',
            'password_confirmation' => 'BaruSekali9',
        ], $this->bearer($token))
            ->assertStatus(422)
            ->assertJsonPath('errors.current_password.0', 'Password saat ini salah.');
    }

    public function test_change_password_rejects_weak_password(): void
    {
        User::factory()->create(['email' => 'a@sulis.test']);
        $token = $this->login('a@sulis.test')->json('data.token');
        $this->resetAuth();

        $this->putJson('/api/v1/auth/password', [
            'current_password' => 'Password123',
            'password' => 'abcdefgh',
            'password_confirmation' => 'abcdefgh',
        ], $this->bearer($token))
            ->assertStatus(422)
            ->assertJsonPath('errors.password.0', 'Password harus mengandung minimal satu angka.');
    }
}
