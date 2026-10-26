<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Supplier;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SupplierApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->finance()->create());
    }

    public function test_list_search_filter_and_all(): void
    {
        Supplier::factory()->create(['name' => 'Toko Sinar Jaya', 'phone' => '0811111111']);
        Supplier::factory()->create(['name' => 'CV Maju', 'phone' => '0822222222']);
        Supplier::factory()->inactive()->create(['name' => 'Toko Lama']);

        $this->getJson('/api/v1/suppliers')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'CV Maju')
            ->assertJsonPath('meta.total', 3);

        $this->getJson('/api/v1/suppliers?search=sinar')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/suppliers?search=08222')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'CV Maju');
        $this->getJson('/api/v1/suppliers?is_active=0')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/suppliers?all=1')->assertOk()->assertJsonCount(2, 'data')->assertJsonMissingPath('meta');
    }

    public function test_create_supplier_writes_audit_log(): void
    {
        $this->postJson('/api/v1/suppliers', [
            'name' => '  Toko Sinar Jaya ',
            'phone' => '0812-3456-789',
            'address' => 'Jl. Merdeka 1, Jakarta',
            'notes' => 'Langganan kabel',
        ])->assertCreated()
            ->assertJsonPath('data.name', 'Toko Sinar Jaya')
            ->assertJsonPath('data.phone', '0812-3456-789')
            ->assertJsonPath('data.is_active', true);

        $this->assertSame(1, AuditLog::where('action', AuditAction::SUPPLIER_CREATED)->count());
    }

    public function test_validation_messages_are_indonesian(): void
    {
        $this->postJson('/api/v1/suppliers', ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Nama wajib diisi.');

        $this->postJson('/api/v1/suppliers', ['name' => 'Toko A', 'phone' => 'abc'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Format telepon tidak valid.');
    }

    public function test_same_name_is_allowed_for_two_suppliers(): void
    {
        Supplier::factory()->create(['name' => 'Toko Jaya']);

        $this->postJson('/api/v1/suppliers', ['name' => 'Toko Jaya'])->assertCreated();
    }

    public function test_update_and_deactivate_supplier(): void
    {
        $supplier = Supplier::factory()->create(['name' => 'Toko A', 'phone' => null]);

        $this->putJson("/api/v1/suppliers/{$supplier->id}", ['name' => 'Toko A', 'phone' => '0811', 'is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.phone', '0811')
            ->assertJsonPath('data.is_active', false);

        $log = AuditLog::where('action', AuditAction::SUPPLIER_UPDATED)->first();
        $this->assertNull($log->changes['before']['phone']);
        $this->assertSame('0811', $log->changes['after']['phone']);
    }

    public function test_gudang_cannot_access_suppliers(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->getJson('/api/v1/suppliers')
            ->assertForbidden()
            ->assertJsonPath('message', 'Anda tidak memiliki akses untuk tindakan ini.');
        $this->postJson('/api/v1/suppliers', ['name' => 'Toko A'])->assertForbidden();
    }
}
