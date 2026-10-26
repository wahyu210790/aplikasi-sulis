<?php

namespace Tests\Feature;

use App\Exceptions\BusinessRuleException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use RuntimeException;
use Tests\TestCase;

class ErrorMessagesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('api')->prefix('api/v1/_test')->group(function () {
            Route::get('auth', fn () => 'ok')->middleware('auth:sanctum');
            Route::get('forbidden', fn () => abort(403));
            Route::get('get-only', fn () => 'ok');
            Route::post('validate', function (Request $request) {
                $request->validate(['name' => 'required', 'email' => 'required|email']);

                return 'ok';
            });
            Route::get('business', fn () => throw new BusinessRuleException('Stok Kabel tidak cukup.'));
            Route::get('crash', fn () => throw new RuntimeException('secret internal detail'));
            Route::get('throttle', fn () => 'ok')->middleware('throttle:2,1');
        });
    }

    public function test_401_message(): void
    {
        $this->getJson('/api/v1/_test/auth')->assertStatus(401)
            ->assertExactJson(['message' => 'Sesi Anda telah berakhir. Silakan masuk kembali.']);
    }

    public function test_403_message(): void
    {
        $this->getJson('/api/v1/_test/forbidden')->assertStatus(403)
            ->assertExactJson(['message' => 'Anda tidak memiliki akses untuk tindakan ini.']);
    }

    public function test_404_message(): void
    {
        $this->getJson('/api/v1/tidak-ada')->assertStatus(404)
            ->assertExactJson(['message' => 'Data tidak ditemukan.']);
    }

    public function test_405_message(): void
    {
        $this->postJson('/api/v1/_test/get-only')->assertStatus(405)
            ->assertExactJson(['message' => 'Metode tidak diizinkan.']);
    }

    public function test_422_validation_is_indonesian(): void
    {
        $this->postJson('/api/v1/_test/validate', ['email' => 'bukan-email'])->assertStatus(422)
            ->assertJsonPath('message', 'Nama wajib diisi.')
            ->assertJsonPath('errors.name.0', 'Nama wajib diisi.')
            ->assertJsonPath('errors.email.0', 'Email harus berupa alamat email yang valid.');
    }

    public function test_422_business_rule(): void
    {
        $this->getJson('/api/v1/_test/business')->assertStatus(422)
            ->assertExactJson(['message' => 'Stok Kabel tidak cukup.']);
    }

    public function test_500_hides_details_when_debug_off(): void
    {
        config(['app.debug' => false]);

        $this->getJson('/api/v1/_test/crash')->assertStatus(500)
            ->assertExactJson(['message' => 'Terjadi kesalahan pada server. Silakan coba lagi.']);
    }

    public function test_429_message(): void
    {
        $this->getJson('/api/v1/_test/throttle')->assertOk();
        $this->getJson('/api/v1/_test/throttle')->assertOk();
        $response = $this->getJson('/api/v1/_test/throttle')->assertStatus(429);
        $this->assertMatchesRegularExpression('/^Terlalu banyak percobaan\. Coba lagi dalam \d+ detik\.$/', $response->json('message'));
    }
}
