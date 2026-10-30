<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** QA bug #2: the same change sent twice (same Idempotency-Key) is saved once and both copies get the same answer. */
class IdempotencyTest extends TestCase
{
    use RefreshDatabase;

    private const KEY = '3f7c1a52-9b1e-4c1d-8a55-0e2b6d4f9a01';

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->owner()->create());
    }

    public function test_same_key_twice_saves_once_and_replays_the_first_answer(): void
    {
        $first = $this->postJson('/api/v1/categories', ['name' => 'Kabel'], ['Idempotency-Key' => self::KEY])->assertCreated();
        $second = $this->postJson('/api/v1/categories', ['name' => 'Kabel'], ['Idempotency-Key' => self::KEY])->assertCreated();

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $second->assertHeader('Idempotent-Replayed', 'true');
        $this->assertFalse($first->headers->has('Idempotent-Replayed'));
        $this->assertSame(1, Category::count());
        $this->assertSame(1, AuditLog::where('action', AuditAction::CATEGORY_CREATED)->count());
    }

    public function test_a_new_key_is_a_new_request(): void
    {
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'], ['Idempotency-Key' => self::KEY])->assertCreated();
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'], ['Idempotency-Key' => 'a1b2c3d4-0000-4000-8000-000000000002'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Nama sudah digunakan.');
        $this->assertSame(1, Category::count());
    }

    public function test_requests_without_key_work_as_before(): void
    {
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'])->assertCreated();
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'])->assertStatus(422);
        $this->assertSame(1, Category::count());
    }

    public function test_same_key_with_other_data_is_refused(): void
    {
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'], ['Idempotency-Key' => self::KEY])->assertCreated();
        $this->postJson('/api/v1/categories', ['name' => 'Pipa'], ['Idempotency-Key' => self::KEY])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Kunci permintaan sudah dipakai untuk data lain. Muat ulang halaman lalu coba lagi.');
        $this->assertSame(['Kabel'], Category::pluck('name')->all());
    }

    public function test_a_validation_error_is_replayed_without_saving(): void
    {
        $this->postJson('/api/v1/categories', ['name' => ''], ['Idempotency-Key' => self::KEY])->assertStatus(422);
        $this->postJson('/api/v1/categories', ['name' => ''], ['Idempotency-Key' => self::KEY])
            ->assertStatus(422)
            ->assertHeader('Idempotent-Replayed', 'true');
        $this->assertSame(0, Category::count());
    }

    public function test_keys_belong_to_one_user(): void
    {
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'], ['Idempotency-Key' => self::KEY])->assertCreated();

        Sanctum::actingAs(User::factory()->owner()->create());
        $this->postJson('/api/v1/categories', ['name' => 'Pipa'], ['Idempotency-Key' => self::KEY])->assertCreated();
        $this->assertSame(2, Category::count());
    }

    public function test_bad_key_is_refused_and_get_ignores_the_header(): void
    {
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'], ['Idempotency-Key' => 'pendek'])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Kunci permintaan tidak valid. Muat ulang halaman lalu coba lagi.');
        $this->assertSame(0, Category::count());

        $this->getJson('/api/v1/categories', ['Idempotency-Key' => 'pendek'])->assertOk();
    }
}
