<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Unit;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UnitApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->owner()->create());
    }

    public function test_list_search_and_all(): void
    {
        Unit::factory()->create(['name' => 'meter', 'symbol' => 'm']);
        Unit::factory()->create(['name' => 'batang', 'symbol' => 'btg']);
        Unit::factory()->inactive()->create(['name' => 'roll', 'symbol' => 'rl']);

        $this->getJson('/api/v1/units')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'batang')
            ->assertJsonPath('meta.total', 3);

        $this->getJson('/api/v1/units?search=btg')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.symbol', 'btg');
        $this->getJson('/api/v1/units?all=1')->assertOk()->assertJsonCount(2, 'data')->assertJsonMissingPath('meta');
    }

    public function test_create_unit_writes_audit_log(): void
    {
        $this->postJson('/api/v1/units', ['name' => 'meter', 'symbol' => 'm'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'meter')
            ->assertJsonPath('data.symbol', 'm');

        $this->assertSame(1, AuditLog::where('action', AuditAction::UNIT_CREATED)->count());
    }

    public function test_name_and_symbol_must_be_unique_ignoring_case(): void
    {
        Unit::factory()->create(['name' => 'meter', 'symbol' => 'm']);

        $this->postJson('/api/v1/units', ['name' => 'Meter', 'symbol' => 'mtr'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Nama sudah digunakan.');

        $this->postJson('/api/v1/units', ['name' => 'meteran', 'symbol' => 'M'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Simbol sudah digunakan.');

        $this->postJson('/api/v1/units', ['name' => 'kilogram'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Simbol wajib diisi.');
    }

    public function test_update_and_deactivate_unit(): void
    {
        $unit = Unit::factory()->create(['name' => 'meter', 'symbol' => 'm']);

        $this->putJson("/api/v1/units/{$unit->id}", ['name' => 'meter', 'symbol' => 'mtr', 'is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.symbol', 'mtr')
            ->assertJsonPath('data.is_active', false);

        $log = AuditLog::where('action', AuditAction::UNIT_UPDATED)->first();
        $this->assertSame('m', $log->changes['before']['symbol']);
        $this->assertSame('mtr', $log->changes['after']['symbol']);
    }

    public function test_finance_can_list_but_not_update(): void
    {
        $unit = Unit::factory()->create();
        Sanctum::actingAs(User::factory()->finance()->create());

        $this->getJson('/api/v1/units')->assertOk();
        $this->putJson("/api/v1/units/{$unit->id}", ['name' => 'x', 'symbol' => 'x', 'is_active' => true])->assertForbidden();
    }
}
