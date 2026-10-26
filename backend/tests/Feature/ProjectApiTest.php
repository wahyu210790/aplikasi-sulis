<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\AuditLog;
use App\Models\Project;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectApiTest extends TestCase
{
    use RefreshDatabase;

    private User $finance;

    protected function setUp(): void
    {
        parent::setUp();
        $this->finance = User::factory()->finance()->create(['name' => 'Bu Finance']);
        Sanctum::actingAs($this->finance);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Gedung X',
            'client_name' => 'PT Klien',
            'location' => 'Jakarta',
            'contract_value' => 150000000,
            'start_date' => '2026-11-01',
            'end_date' => '2027-02-28',
            'notes' => null,
        ], $overrides);
    }

    public function test_create_project_without_code_gets_auto_code(): void
    {
        $response = $this->postJson('/api/v1/projects', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.code', 'PRJ-0001')
            ->assertJsonPath('data.status', 'aktif')
            ->assertJsonPath('data.status_label', 'Aktif')
            ->assertJsonPath('data.contract_value', 150000000)
            ->assertJsonPath('data.start_date', '2026-11-01')
            ->assertJsonPath('data.created_by.name', 'Bu Finance');

        $log = AuditLog::where('action', AuditAction::PROJECT_CREATED)->first();
        $this->assertSame($response->json('data.id'), $log->subject_id);
        $this->assertSame('PRJ-0001', $log->changes['after']['code']);

        $this->postJson('/api/v1/projects', $this->payload(['name' => 'Gedung Y']))
            ->assertCreated()
            ->assertJsonPath('data.code', 'PRJ-0002');
    }

    public function test_own_code_is_uppercased_and_unique(): void
    {
        $this->postJson('/api/v1/projects', $this->payload(['code' => ' gdx-01 ']))
            ->assertCreated()
            ->assertJsonPath('data.code', 'GDX-01');

        $this->postJson('/api/v1/projects', $this->payload(['code' => 'GDX-01']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Kode sudah digunakan.');
    }

    public function test_auto_code_skips_a_code_typed_by_a_user(): void
    {
        // The first project (id 1) was given the code that id 2 would get.
        $this->postJson('/api/v1/projects', $this->payload(['code' => 'PRJ-0002']))->assertCreated();

        $this->postJson('/api/v1/projects', $this->payload(['name' => 'Gedung Y']))
            ->assertCreated()
            ->assertJsonPath('data.code', 'PRJ-0002-2');
    }

    public function test_validation_messages(): void
    {
        $this->postJson('/api/v1/projects', $this->payload(['name' => '']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Nama wajib diisi.');

        $this->postJson('/api/v1/projects', $this->payload(['start_date' => '2026-11-10', 'end_date' => '2026-11-09']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Tanggal selesai harus tanggal yang sama atau setelah tanggal mulai.');

        $this->postJson('/api/v1/projects', $this->payload(['contract_value' => -1]))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Nilai kontrak minimal 0.');

        $this->postJson('/api/v1/projects', $this->payload(['contract_value' => 1000000000000]))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Nilai kontrak maksimal 999999999999.');

        // Dates are optional; end date alone is fine.
        $this->postJson('/api/v1/projects', $this->payload(['start_date' => null, 'end_date' => '2026-12-01', 'contract_value' => null]))
            ->assertCreated()
            ->assertJsonPath('data.contract_value', 0);
    }

    public function test_update_fields_and_status_write_separate_audit_logs(): void
    {
        $project = Project::factory()->create(['code' => 'PRJ-0001', 'name' => 'Gedung X', 'contract_value' => 100]);
        $body = fn (array $o = []) => $this->payload(array_merge(['code' => 'PRJ-0001', 'status' => 'aktif'], $o));

        $this->putJson("/api/v1/projects/{$project->id}", $body(['name' => 'Gedung X2']))
            ->assertOk()
            ->assertJsonPath('data.name', 'Gedung X2');
        $this->assertSame(1, AuditLog::where('action', AuditAction::PROJECT_UPDATED)->count());
        $this->assertSame(0, AuditLog::where('action', AuditAction::PROJECT_STATUS_CHANGED)->count());

        $this->putJson("/api/v1/projects/{$project->id}", $body(['name' => 'Gedung X2', 'status' => 'selesai']))
            ->assertOk()
            ->assertJsonPath('data.status', 'selesai')
            ->assertJsonPath('data.status_label', 'Selesai');

        $status = AuditLog::where('action', AuditAction::PROJECT_STATUS_CHANGED)->first();
        $this->assertSame(['status' => 'aktif'], $status->changes['before']);
        $this->assertSame(['status' => 'selesai'], $status->changes['after']);
        $this->assertSame(1, AuditLog::where('action', AuditAction::PROJECT_UPDATED)->count());

        $this->putJson("/api/v1/projects/{$project->id}", $body(['status' => 'tutup']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Status yang dipilih tidak valid.');
    }

    public function test_list_filters_and_all(): void
    {
        Project::factory()->create(['code' => 'PRJ-0001', 'name' => 'Gedung X', 'client_name' => 'PT Alfa']);
        Project::factory()->status(ProjectStatus::Selesai)->create(['code' => 'PRJ-0002', 'name' => 'Ruko Y']);
        Project::factory()->status(ProjectStatus::Batal)->create(['code' => 'PRJ-0003', 'name' => 'Rumah Z']);

        $this->getJson('/api/v1/projects')->assertOk()->assertJsonCount(3, 'data')->assertJsonPath('meta.total', 3);
        $this->getJson('/api/v1/projects?status=selesai')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.code', 'PRJ-0002');
        $this->getJson('/api/v1/projects?search=alfa')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.code', 'PRJ-0001');
        $this->getJson('/api/v1/projects?sort=code&direction=asc')->assertOk()->assertJsonPath('data.0.code', 'PRJ-0001');
        $this->getJson('/api/v1/projects?all=1')->assertOk()->assertJsonCount(1, 'data')->assertJsonMissingPath('meta');
        $this->getJson('/api/v1/projects?all=1&status=batal')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.code', 'PRJ-0003');
    }

    public function test_gudang_can_view_without_contract_value_but_not_change(): void
    {
        $project = Project::factory()->create(['contract_value' => 150000000]);
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->getJson("/api/v1/projects/{$project->id}")
            ->assertOk()
            ->assertJsonPath('data.code', $project->code)
            ->assertJsonMissingPath('data.contract_value');

        $this->postJson('/api/v1/projects', $this->payload())->assertForbidden();
        $this->putJson("/api/v1/projects/{$project->id}", $this->payload(['code' => $project->code, 'status' => 'aktif']))->assertForbidden();
        $this->getJson('/api/v1/projects/999')->assertNotFound();
    }
}
