<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use App\Services\AuditLogger;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * docs/desain-v2.md B8. The last three "every action" tests make a NEW AuditAction constant fail until
 * (1) app code writes it and (2) a feature test checks it (e.g. a later T5.05 must extend both).
 */
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

    public function test_reactivating_a_user_is_logged(): void
    {
        $owner = User::factory()->owner()->create();
        $user = User::factory()->gudang()->create(['name' => 'Budi']);
        Sanctum::actingAs($owner);
        $body = fn (bool $active) => ['name' => 'Budi', 'email' => $user->email, 'role' => 'gudang', 'is_active' => $active];

        $this->putJson("/api/v1/users/{$user->id}", $body(false))->assertOk();
        $this->putJson("/api/v1/users/{$user->id}", $body(true))->assertOk();

        $log = AuditLog::where('action', AuditAction::USER_ACTIVATED)->sole();
        $this->assertSame([$owner->id, 'user', $user->id, 'Mengaktifkan pengguna Budi'], [$log->user_id, $log->subject_type, $log->subject_id, $log->summary]);
    }

    public function test_owner_lists_audit_logs_newest_first_with_filters(): void
    {
        $owner = User::factory()->owner()->create(['name' => 'Pak Owner']);
        $gudang = User::factory()->gudang()->create(['name' => 'Gudang Satu']);
        $logger = app(AuditLogger::class);
        $this->travelTo('2026-10-20 09:00:00');
        $logger->log(AuditAction::CATEGORY_CREATED, null, 'Kategori lama', null, ['name' => 'Kabel'], $gudang);
        $this->travelTo('2026-10-27 10:00:00');
        $logger->log(AuditAction::OPNAME_CREATED, null, 'Opname dibuat', null, null, $gudang);
        $logger->log(AuditAction::OPNAME_POSTED, null, 'Opname disetujui', ['status' => 'menunggu_persetujuan'], ['status' => 'selesai'], $owner);
        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/audit-logs')
            ->assertOk()
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('data.0.action', 'opname.posted')
            ->assertJsonPath('data.0.summary', 'Opname disetujui')
            ->assertJsonPath('data.0.user', ['id' => $owner->id, 'name' => 'Pak Owner', 'role' => 'owner'])
            ->assertJsonPath('data.0.changes', ['before' => ['status' => 'menunggu_persetujuan'], 'after' => ['status' => 'selesai']])
            ->assertJsonPath('data.2.action', 'category.created');

        $this->getJson('/api/v1/audit-logs?action=opname')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/v1/audit-logs?action=opname.posted')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/audit-logs?action=opn')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson("/api/v1/audit-logs?user_id={$gudang->id}")->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/v1/audit-logs?date_from=2026-10-27&date_to=2026-10-27')->assertOk()->assertJsonPath('meta.total', 2);
        $this->getJson('/api/v1/audit-logs?date_to=2026-10-20')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/audit-logs?action=opname%25')->assertStatus(422)->assertJsonValidationErrors('action');
        $this->getJson('/api/v1/audit-logs?user_id=99999')->assertStatus(422)->assertJsonValidationErrors('user_id');

        Sanctum::actingAs($gudang);
        $this->getJson('/api/v1/audit-logs')->assertForbidden();
    }

    public function test_every_action_constant_is_written_by_app_code(): void
    {
        $code = '';
        foreach ($this->phpFiles(app_path()) as $file) {
            if (! str_ends_with($file, 'Support/AuditAction.php') && ! str_ends_with($file, 'Services/AuditLogger.php')) {
                $code .= file_get_contents($file);
            }
        }

        $missing = array_keys(array_filter($this->actionConstants(), fn ($value, $name) => ! str_contains($code, "AuditAction::{$name}"), ARRAY_FILTER_USE_BOTH));

        $this->assertSame([], $missing, 'Every AuditAction constant must be logged somewhere in app/.');
    }

    public function test_every_action_constant_is_checked_by_a_feature_test(): void
    {
        $tests = '';
        foreach ($this->phpFiles(base_path('tests/Feature')) as $file) {
            $tests .= file_get_contents($file);
        }

        $missing = array_keys(array_filter(
            $this->actionConstants(),
            fn ($value, $name) => ! preg_match('/AuditAction::'.$name.'\b/', $tests) && ! str_contains($tests, "'{$value}'"),
            ARRAY_FILTER_USE_BOTH,
        ));

        $this->assertSame([], $missing, 'Every AuditAction constant must be asserted in a tests/Feature test.');
    }

    /** @return array<string, string> constant name => action string */
    private function actionConstants(): array
    {
        return (new \ReflectionClass(AuditAction::class))->getConstants();
    }

    /** @return list<string> */
    private function phpFiles(string $dir): array
    {
        $files = [];
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)) as $file) {
            if ($file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        return $files;
    }
}
