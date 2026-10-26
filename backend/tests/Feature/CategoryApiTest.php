<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->gudang()->create());
    }

    public function test_list_uses_standard_envelope_and_filters(): void
    {
        Category::factory()->create(['name' => 'Kabel']);
        Category::factory()->create(['name' => 'Pipa']);
        Category::factory()->inactive()->create(['name' => 'Lampu Lama']);

        $this->getJson('/api/v1/categories?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name', 'Kabel')
            ->assertJsonPath('meta.total', 3)
            ->assertJsonPath('meta.last_page', 2);

        $this->getJson('/api/v1/categories?search=pip')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Pipa');
        $this->getJson('/api/v1/categories?is_active=0')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Lampu Lama');
    }

    public function test_all_returns_only_active_without_meta(): void
    {
        Category::factory()->create(['name' => 'Kabel']);
        Category::factory()->inactive()->create(['name' => 'Lampu Lama']);

        $this->getJson('/api/v1/categories?all=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Kabel')
            ->assertJsonMissingPath('meta');
    }

    public function test_create_category_writes_audit_log(): void
    {
        $this->postJson('/api/v1/categories', ['name' => '  Kabel  '])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Kabel')
            ->assertJsonPath('data.is_active', true);

        $category = Category::firstWhere('name', 'Kabel');
        $this->assertNotNull($category);

        $log = AuditLog::where('action', AuditAction::CATEGORY_CREATED)->first();
        $this->assertNotNull($log);
        $this->assertSame('category', $log->subject_type);
        $this->assertSame($category->id, $log->subject_id);
    }

    public function test_name_must_be_unique_ignoring_case(): void
    {
        Category::factory()->create(['name' => 'Kabel']);

        $this->postJson('/api/v1/categories', ['name' => 'KABEL'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Nama sudah digunakan.');

        $this->postJson('/api/v1/categories', ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Nama wajib diisi.');
    }

    public function test_update_and_deactivate_category(): void
    {
        $category = Category::factory()->create(['name' => 'Kabel']);

        // Saving the same name (other case) for the same row is allowed.
        $this->putJson("/api/v1/categories/{$category->id}", ['name' => 'Kabel Listrik', 'is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.name', 'Kabel Listrik')
            ->assertJsonPath('data.is_active', false);

        $this->putJson("/api/v1/categories/{$category->id}", ['name' => 'KABEL LISTRIK', 'is_active' => false])
            ->assertOk();

        $log = AuditLog::where('action', AuditAction::CATEGORY_UPDATED)->first();
        $this->assertSame(['name' => 'Kabel', 'is_active' => true], $log->changes['before']);
        $this->assertSame(['name' => 'Kabel Listrik', 'is_active' => false], $log->changes['after']);
    }

    public function test_finance_can_list_but_not_create(): void
    {
        Sanctum::actingAs(User::factory()->finance()->create());

        $this->getJson('/api/v1/categories')->assertOk();
        $this->postJson('/api/v1/categories', ['name' => 'Kabel'])
            ->assertForbidden()
            ->assertJsonPath('message', 'Anda tidak memiliki akses untuk tindakan ini.');
    }

    public function test_unknown_category_returns_404(): void
    {
        $this->putJson('/api/v1/categories/999', ['name' => 'X', 'is_active' => true])
            ->assertNotFound()
            ->assertJsonPath('message', 'Data tidak ditemukan.');
    }
}
