<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Enums\ProjectStatus;
use App\Models\Product;
use App\Models\Project;
use App\Models\ProjectCost;
use App\Models\User;
use App\Services\MovementContext;
use App\Services\StockLedger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\AssertsNoMoneyKeys;
use Tests\TestCase;

/** docs/desain-v2.md B4.6, B6, B7, B9.2: profit summary, project-profit report and the project material report. */
class ProjectProfitReportTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use RefreshDatabase;

    private User $owner;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create();
        $this->pipe = Product::factory()->create(['name' => 'Pipa PVC']);
        DB::transaction(fn () => app(StockLedger::class)->apply(
            [['product_id' => $this->pipe->id, 'qty' => '10', 'value' => 250000]],
            new MovementContext(MovementType::Opening, '2026-10-20', $this->owner->id),
        ));
    }

    private function issue(Project $project, string $qty): void
    {
        DB::transaction(fn () => app(StockLedger::class)->apply(
            [['product_id' => $this->pipe->id, 'qty' => $qty]],
            new MovementContext(MovementType::ProjectOut, '2026-10-21', $this->owner->id, $project->id),
        ));
    }

    public function test_gudang_gets_no_summary_and_no_money_but_sees_material_quantities(): void
    {
        $project = Project::factory()->create(['contract_value' => 1000000]);
        $this->issue($project, '4');
        ProjectCost::factory()->create(['project_id' => $project->id, 'amount' => 50000]);
        Sanctum::actingAs(User::factory()->gudang()->create());

        $show = $this->getJson("/api/v1/projects/{$project->id}")->assertOk()->assertJsonMissingPath('data.summary');
        $this->assertNoMoneyKeys($show);

        $materials = $this->getJson("/api/v1/reports/projects/{$project->id}/materials")
            ->assertOk()
            ->assertJsonPath('data.0.product.name', 'Pipa PVC')
            ->assertJsonPath('data.0.net_qty', '4.000')
            ->assertJsonMissingPath('totals');
        $this->assertNoMoneyKeys($materials);

        $this->getJson('/api/v1/reports/project-profit')->assertForbidden();
    }

    public function test_margin_is_null_without_contract_value_and_profit_can_be_negative(): void
    {
        $noContract = Project::factory()->create(['code' => 'PRJ-1', 'contract_value' => 0]);
        $loss = Project::factory()->create(['code' => 'PRJ-2', 'contract_value' => 100000]);
        $this->issue($noContract, '2');
        $this->issue($loss, '6');
        Sanctum::actingAs($this->owner);

        $this->getJson("/api/v1/projects/{$noContract->id}")
            ->assertJsonPath('data.summary', ['material_cost' => 50000, 'other_costs' => 0, 'profit' => -50000, 'margin_percent' => null]);
        $this->getJson("/api/v1/projects/{$loss->id}")
            ->assertJsonPath('data.summary', ['material_cost' => 150000, 'other_costs' => 0, 'profit' => -50000, 'margin_percent' => -50]);
    }

    public function test_report_status_filter_and_projects_without_movements(): void
    {
        Project::factory()->create(['code' => 'PRJ-1', 'contract_value' => 2000000]);
        Project::factory()->status(ProjectStatus::Selesai)->create(['code' => 'PRJ-2', 'contract_value' => 3000000]);
        Sanctum::actingAs(User::factory()->finance()->create());

        $this->getJson('/api/v1/reports/project-profit')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.material_cost', 0)
            ->assertJsonPath('data.0.profit', 2000000)
            ->assertJsonPath('data.0.margin_percent', 100)
            ->assertJsonPath('totals.profit', 5000000);

        $this->getJson('/api/v1/reports/project-profit?status=selesai')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.code', 'PRJ-2')
            ->assertJsonPath('data.0.status_label', 'Selesai')
            ->assertJsonPath('totals.contract_value', 3000000);

        $this->getJson('/api/v1/reports/project-profit?status=xyz')->assertUnprocessable()->assertJsonValidationErrors(['status']);
    }

    public function test_material_report_of_a_project_without_material_is_empty(): void
    {
        $project = Project::factory()->create();
        Sanctum::actingAs($this->owner);

        $this->getJson("/api/v1/reports/projects/{$project->id}/materials")
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('totals.net_value', 0);
        $this->getJson('/api/v1/reports/projects/999999/materials')->assertNotFound();
    }
}
