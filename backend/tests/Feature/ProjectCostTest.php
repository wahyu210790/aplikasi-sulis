<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\AuditLog;
use App\Models\Project;
use App\Models\ProjectCost;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** docs/desain-v2.md B3.9 + B9.2: GET|POST /projects/{id}/costs, PUT|DELETE /projects/{id}/costs/{costId}. */
class ProjectCostTest extends TestCase
{
    use RefreshDatabase;

    private User $finance;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->finance = User::factory()->finance()->create(['name' => 'Fina']);
        $this->project = Project::factory()->create(['code' => 'PRJ-0001', 'contract_value' => 10000000]);
        Sanctum::actingAs($this->finance);
    }

    private function url(?ProjectCost $cost = null, ?Project $project = null): string
    {
        $base = '/api/v1/projects/'.($project ?? $this->project)->id.'/costs';

        return $cost ? $base.'/'.$cost->id : $base;
    }

    public function test_finance_adds_a_cost_and_it_is_audited(): void
    {
        $this->postJson($this->url(), [
            'cost_date' => '2026-10-25',
            'description' => '  Upah tukang  ',
            'amount' => 1500000,
        ])->assertCreated()
            ->assertJsonPath('data.project_id', $this->project->id)
            ->assertJsonPath('data.cost_date', '2026-10-25')
            ->assertJsonPath('data.description', 'Upah tukang')
            ->assertJsonPath('data.amount', 1500000)
            ->assertJsonPath('data.created_by.name', 'Fina')
            ->assertJsonPath('data.updated_by', null);

        $cost = ProjectCost::sole();
        $this->assertSame($this->finance->id, $cost->created_by);

        $log = AuditLog::where('action', AuditAction::PROJECT_COST_CREATED)->sole();
        $this->assertSame($cost->id, $log->subject_id);
        $this->assertSame('Menambah biaya lain proyek PRJ-0001: Upah tukang Rp 1.500.000', $log->summary);
        $this->assertNull($log->changes['before'] ?? null);
        $this->assertSame(['cost_date' => '2026-10-25', 'description' => 'Upah tukang', 'amount' => 1500000], $log->changes['after'] ?? null);
    }

    public function test_list_shows_only_this_projects_costs_newest_date_first(): void
    {
        ProjectCost::factory()->create(['project_id' => $this->project->id, 'cost_date' => '2026-10-20', 'description' => 'Sewa scaffolding', 'amount' => 500000]);
        ProjectCost::factory()->create(['project_id' => $this->project->id, 'cost_date' => '2026-10-26', 'description' => 'Upah tukang', 'amount' => 1000000]);
        ProjectCost::factory()->create(['description' => 'Biaya proyek lain']);

        $this->getJson($this->url())
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.description', 'Upah tukang')
            ->assertJsonPath('data.1.description', 'Sewa scaffolding')
            ->assertJsonPath('meta.total', 2);
    }

    public function test_owner_updates_a_cost_with_before_and_after_in_the_audit_log(): void
    {
        $cost = ProjectCost::factory()->create(['project_id' => $this->project->id, 'cost_date' => '2026-10-20', 'description' => 'Upah tukang', 'amount' => 1000000, 'created_by' => $this->finance->id]);
        $owner = User::factory()->owner()->create(['name' => 'Olga']);
        Sanctum::actingAs($owner);

        $this->putJson($this->url($cost), ['cost_date' => '2026-10-21', 'description' => 'Upah tukang 2 orang', 'amount' => 1500000])
            ->assertOk()
            ->assertJsonPath('data.amount', 1500000)
            ->assertJsonPath('data.cost_date', '2026-10-21')
            ->assertJsonPath('data.created_by.name', 'Fina')
            ->assertJsonPath('data.updated_by.name', 'Olga');

        $log = AuditLog::where('action', AuditAction::PROJECT_COST_UPDATED)->sole();
        $this->assertSame(['cost_date' => '2026-10-20', 'description' => 'Upah tukang', 'amount' => 1000000], $log->changes['before'] ?? null);
        $this->assertSame(['cost_date' => '2026-10-21', 'description' => 'Upah tukang 2 orang', 'amount' => 1500000], $log->changes['after'] ?? null);
        $this->assertSame($owner->id, $log->user_id);
    }

    public function test_saving_without_changes_writes_no_audit_entry(): void
    {
        $cost = ProjectCost::factory()->create(['project_id' => $this->project->id, 'cost_date' => '2026-10-20', 'description' => 'Upah tukang', 'amount' => 1000000]);

        $this->putJson($this->url($cost), ['cost_date' => '2026-10-20', 'description' => 'Upah tukang', 'amount' => 1000000])
            ->assertOk()
            ->assertJsonPath('data.updated_by', null);

        $this->assertSame(0, AuditLog::where('action', AuditAction::PROJECT_COST_UPDATED)->count());
    }

    public function test_delete_removes_the_cost_and_is_audited(): void
    {
        $cost = ProjectCost::factory()->create(['project_id' => $this->project->id, 'cost_date' => '2026-10-20', 'description' => 'Sewa genset', 'amount' => 750000]);

        $this->deleteJson($this->url($cost))->assertNoContent();

        $this->assertSame(0, ProjectCost::count());
        $log = AuditLog::where('action', AuditAction::PROJECT_COST_DELETED)->sole();
        $this->assertSame('Menghapus biaya lain proyek PRJ-0001: Sewa genset Rp 750.000', $log->summary);
        $this->assertSame(['cost_date' => '2026-10-20', 'description' => 'Sewa genset', 'amount' => 750000], $log->changes['before'] ?? null);
        $this->assertNull($log->changes['after'] ?? null);
    }

    public function test_a_cost_of_another_project_is_not_found(): void
    {
        $other = Project::factory()->create();
        $cost = ProjectCost::factory()->create(['project_id' => $other->id]);

        $this->putJson($this->url($cost), ['cost_date' => '2026-10-20', 'description' => 'X', 'amount' => 1])->assertNotFound();
        $this->deleteJson($this->url($cost))->assertNotFound();
        $this->assertSame(1, ProjectCost::count());
    }

    public function test_validation_messages_are_indonesian(): void
    {
        $this->postJson($this->url(), [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['cost_date', 'description', 'amount']);

        $this->postJson($this->url(), ['cost_date' => '2026-10-20', 'description' => 'Upah', 'amount' => 0])
            ->assertUnprocessable()
            ->assertJsonPath('errors.amount.0', 'Jumlah biaya harus lebih dari 0.');

        $this->postJson($this->url(), ['cost_date' => '2026-10-20', 'description' => 'Upah', 'amount' => 1000000000000])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['amount']);

        $this->postJson($this->url(), ['cost_date' => '2026-10-28', 'description' => 'Upah', 'amount' => 1000])
            ->assertUnprocessable()
            ->assertJsonPath('errors.cost_date.0', 'Tanggal biaya tidak boleh melewati hari ini.');

        $this->postJson($this->url(), ['cost_date' => '2026-09-26', 'description' => 'Upah', 'amount' => 1000])
            ->assertUnprocessable()
            ->assertJsonPath('errors.cost_date.0', 'Tanggal biaya paling lama 30 hari ke belakang (paling awal 27-09-2026).');

        $this->postJson($this->url(), ['cost_date' => '2026-10-20', 'description' => str_repeat('a', 201), 'amount' => 1000])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['description']);

        $this->assertSame(0, ProjectCost::count());
    }

    public function test_costs_can_be_added_whatever_the_project_status(): void
    {
        // B3.9 sets no status limit for other costs (see open questions in the checklist).
        $done = Project::factory()->status(ProjectStatus::Selesai)->create();

        $this->postJson($this->url(null, $done), ['cost_date' => '2026-10-27', 'description' => 'Biaya akhir', 'amount' => 1000])->assertCreated();
    }

    public function test_gudang_cannot_see_or_change_costs(): void
    {
        $cost = ProjectCost::factory()->create(['project_id' => $this->project->id]);
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->getJson($this->url())->assertForbidden();
        $this->postJson($this->url(), ['cost_date' => '2026-10-27', 'description' => 'X', 'amount' => 1])->assertForbidden();
        $this->putJson($this->url($cost), ['cost_date' => '2026-10-27', 'description' => 'X', 'amount' => 1])->assertForbidden();
        $this->deleteJson($this->url($cost))->assertForbidden();
        $this->assertSame(1, ProjectCost::count());
    }
}
