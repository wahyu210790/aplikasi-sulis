<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** T6.05: production settings (backend/.env.production.example, .htaccess) and php artisan app:check-production. */
class ProductionHardeningTest extends TestCase
{
    use RefreshDatabase;

    /** Production-like config. The test DB stays SQLite, so only the database check can fail. */
    private function productionConfig(): void
    {
        $this->app['env'] = 'production';
        config([
            'app.debug' => false,
            'app.key' => 'base64:'.base64_encode(str_repeat('k', 32)),
            'app.url' => 'https://app.bestengineerpersada.com',
            'logging.default' => 'daily',
            'logging.channels.daily.level' => 'warning',
        ]);
    }

    public function test_check_production_fails_on_a_development_setup(): void
    {
        config(['app.debug' => true, 'app.url' => 'http://localhost']);

        $this->artisan('app:check-production')
            ->expectsOutput('[GAGAL] APP_ENV=production')
            ->expectsOutput('[GAGAL] APP_DEBUG=false (detail error tidak tampil)')
            ->expectsOutput('[GAGAL] APP_URL memakai https://')
            ->expectsOutput('[GAGAL] Ada minimal 1 Owner aktif')
            ->assertFailed();
    }

    public function test_check_production_passes_every_setting_check_on_a_production_setup(): void
    {
        $this->productionConfig();
        User::factory()->owner()->create(['email' => 'sulis@bestengineer.co.id']);

        $this->artisan('app:check-production')
            ->expectsOutput('[OK]    APP_ENV=production')
            ->expectsOutput('[OK]    APP_DEBUG=false (detail error tidak tampil)')
            ->expectsOutput('[OK]    APP_KEY terisi')
            ->expectsOutput('[OK]    APP_URL memakai https://')
            ->expectsOutput('[OK]    LOG_CHANNEL=daily, LOG_LEVEL bukan debug')
            ->expectsOutput('[GAGAL] Database MySQL/MariaDB')   // SQLite in tests; MySQL on the server
            ->expectsOutput('[OK]    Semua migrasi sudah dijalankan')
            ->expectsOutput('[OK]    Ada minimal 1 Owner aktif')
            ->expectsOutput('[OK]    Tidak ada akun demo (@sulis.test)')
            ->expectsOutput('1 pemeriksaan gagal. Perbaiki dulu sebelum aplikasi dipakai.')
            ->assertFailed();
    }

    public function test_check_production_flags_demo_accounts_and_inactive_owners(): void
    {
        $this->productionConfig();
        User::factory()->owner()->create(['email' => 'owner@sulis.test', 'is_active' => false]);

        $this->artisan('app:check-production')
            ->expectsOutput('[GAGAL] Ada minimal 1 Owner aktif')
            ->expectsOutput('[GAGAL] Tidak ada akun demo (@sulis.test)')
            ->assertFailed();
    }

    public function test_check_production_changes_nothing(): void
    {
        $this->productionConfig();
        User::factory()->owner()->create(['email' => 'sulis@bestengineer.co.id']);
        $before = [User::count(), AuditLog::count(), User::first()->updated_at->toJSON()];

        $this->artisan('app:check-production');

        $this->assertSame($before, [User::count(), AuditLog::count(), User::first()->updated_at->toJSON()]);
    }

    public function test_production_env_example_has_safe_values_and_no_secrets(): void
    {
        $lines = file(base_path('.env.production.example'), FILE_IGNORE_NEW_LINES);
        $env = [];
        foreach ($lines as $line) {
            if (preg_match('/^([A-Z0-9_]+)=(.*)$/', $line, $m)) {
                $env[$m[1]] = $m[2];
            }
        }

        foreach ([
            'APP_ENV' => 'production', 'APP_DEBUG' => 'false', 'APP_URL' => 'https://app.bestengineerpersada.com',
            'APP_TIMEZONE' => 'Asia/Jakarta', 'APP_LOCALE' => 'id', 'LOG_CHANNEL' => 'daily', 'LOG_LEVEL' => 'warning',
            'DB_CONNECTION' => 'mysql', 'SESSION_DRIVER' => 'array', 'CACHE_STORE' => 'database',
            'MAIL_MAILER' => 'log', 'CORS_ALLOWED_ORIGINS' => '', 'APP_KEY' => '', 'DB_PASSWORD' => '',
        ] as $key => $value) {
            $this->assertArrayHasKey($key, $env, $key);
            $this->assertSame($value, $env[$key], $key);
        }
    }

    public function test_htaccess_sends_security_headers_and_blocks_server_files(): void
    {
        $htaccess = file_get_contents(base_path('../.htaccess'));

        foreach (["frame-ancestors 'none'", 'X-Content-Type-Options "nosniff"', 'Referrer-Policy "same-origin"', 'X-Frame-Options "DENY"'] as $header) {
            $this->assertStringContainsString($header, $htaccess);
        }
        foreach (['artisan', 'composer\.(json|lock)', 'phpunit\.xml', 'AGENTS\.md'] as $file) {
            $this->assertStringContainsString($file, $htaccess);
        }
    }

    public function test_user_json_never_contains_the_password_hash(): void
    {
        $owner = User::factory()->owner()->create();
        Sanctum::actingAs($owner);

        $this->getJson('/api/v1/users')->assertOk()->assertJsonMissingPath('data.0.password');
        $this->getJson('/api/v1/auth/me')->assertOk()->assertJsonMissingPath('data.password');
        $this->assertStringNotContainsString($owner->password, $this->getJson('/api/v1/users')->getContent());
    }
}
