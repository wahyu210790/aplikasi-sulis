<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    public function test_successful_login_is_logged(): void
    {
        $user = User::factory()->create(['email' => 'a@sulis.test']);

        $this->postJson('/api/v1/auth/login', ['email' => 'a@sulis.test', 'password' => 'Password123'])->assertOk();

        $log = AuditLog::where('action', AuditAction::AUTH_LOGIN)->first();
        $this->assertNotNull($log);
        $this->assertSame($user->id, $log->user_id);
        $this->assertSame('user', $log->subject_type);
        $this->assertSame($user->id, $log->subject_id);
    }

    public function test_failed_login_is_logged_without_password(): void
    {
        $this->postJson('/api/v1/auth/login', ['email' => 'x@sulis.test', 'password' => 'RahasiaSekali1'])->assertStatus(422);

        $log = AuditLog::where('action', AuditAction::AUTH_LOGIN_FAILED)->first();
        $this->assertNotNull($log);
        $this->assertNull($log->user_id);
        $this->assertStringContainsString('x@sulis.test', $log->summary);
        $this->assertStringNotContainsString('RahasiaSekali1', json_encode($log->toArray()));
    }

    public function test_logout_and_password_change_are_logged(): void
    {
        User::factory()->create(['email' => 'a@sulis.test']);
        $token = $this->postJson('/api/v1/auth/login', ['email' => 'a@sulis.test', 'password' => 'Password123'])->json('data.token');
        $this->app['auth']->forgetGuards();

        $this->putJson('/api/v1/auth/password', [
            'current_password' => 'Password123',
            'password' => 'BaruSekali9',
            'password_confirmation' => 'BaruSekali9',
        ], ['Authorization' => 'Bearer '.$token])->assertNoContent();
        $this->app['auth']->forgetGuards();
        $this->postJson('/api/v1/auth/logout', [], ['Authorization' => 'Bearer '.$token])->assertNoContent();

        $this->assertTrue(AuditLog::where('action', AuditAction::AUTH_PASSWORD_CHANGED)->exists());
        $this->assertTrue(AuditLog::where('action', AuditAction::AUTH_LOGOUT)->exists());
        $this->assertStringNotContainsString('BaruSekali9', AuditLog::all()->toJson());
    }

    public function test_logger_stores_before_and_after(): void
    {
        $user = User::factory()->owner()->create();
        $this->actingAs($user);

        $log = app(AuditLogger::class)->log(AuditAction::USER_UPDATED, $user, 'Ubah nama', ['name' => 'A'], ['name' => 'B']);

        $this->assertSame(['before' => ['name' => 'A'], 'after' => ['name' => 'B']], $log->fresh()->changes);
        $this->assertSame($user->id, $log->user_id);
    }

    public function test_logger_rejects_unknown_action(): void
    {
        $this->expectException(InvalidArgumentException::class);

        app(AuditLogger::class)->log('user.something_else', null, 'x');
    }
}
