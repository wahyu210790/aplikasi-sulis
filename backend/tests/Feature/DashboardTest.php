<?php

namespace Tests\Feature;

use App\Enums\ProjectStatus;
use App\Models\Product;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\AssertsNoMoneyKeys;
use Tests\TestCase;

/**
 * docs/desain-v2.md B9.2 Dashboard: GET /dashboard is role-specific.
 * Data: the B4.7 example (A profit 8.040.000, B profit 3.720.000, 70 m left worth 840.000) with min_stock 100 m,
 * plus one draft purchase, one batal project and one aktif project without contract.
 */
class DashboardTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use RefreshDatabase;

    private User $owner;

    private User $gudang;

    private User $finance;

    private Product $cable;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create();
        $this->gudang = User::factory()->gudang()->create();
        $this->finance = User::factory()->finance()->create();
        $this->cable = Product::factory()->create([
            'name' => 'Kabel NYM 2x1.5',
            'min_stock' => '100',
            'unit_id' => Unit::factory()->create(['symbol' => 'm'])->id,
        ]);
    }

    private function buy(string $qty, int $price): void
    {
        $purchase = Purchase::factory()->withItem($this->cable, $qty, $price)->create();
        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$purchase->id}/receive")->assertOk();
    }

    private function stock(string $path, Project $project, string $qty, string $date = '2026-10-27'): void
    {
        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/{$path}", [
            'project_id' => $project->id,
            'person_name' => 'Budi',
            'transaction_date' => $date,
            'items' => [['product_id' => $this->cable->id, 'qty' => $qty]],
        ])->assertCreated();
    }

    /** B4.7 steps 1–7, the 1.500.000 other cost of A, one draft purchase, a batal project C and an aktif project D (contract 0). */
    private function seedScenario(): array
    {
        $a = Project::factory()->create(['code' => 'PRJ-A', 'contract_value' => 10000000]);
        $b = Project::factory()->create(['code' => 'PRJ-B', 'contract_value' => 5000000]);
        Project::factory()->create(['code' => 'PRJ-C', 'contract_value' => 99000000, 'status' => ProjectStatus::Batal]);
        Project::factory()->create(['code' => 'PRJ-D', 'contract_value' => 0]);

        $this->buy('100', 10000);
        $this->buy('100', 13000);
        $this->stock('stock-outs', $a, '50');
        $this->stock('stock-outs', $b, '80');
        $this->stock('stock-returns', $a, '10');
        $this->buy('20', 14000);
        $this->stock('stock-outs', $b, '30');

        Sanctum::actingAs($this->finance);
        $this->postJson("/api/v1/projects/{$a->id}/costs", ['cost_date' => '2026-10-27', 'description' => 'Upah tukang', 'amount' => 1500000])->assertCreated();

        Purchase::factory()->withItem($this->cable, '50', 15000)->create(['number' => 'PB-DRAFT']);

        return [$a, $b];
    }

    public function test_owner_and_finance_get_totals_top_projects_and_recent_movements(): void
    {
        $this->seedScenario();

        foreach ([$this->owner, $this->finance] as $user) {
            Sanctum::actingAs($user);
            $response = $this->getJson('/api/v1/dashboard')->assertOk();
            $response->assertJsonPath('data.view', 'money')
                ->assertJsonPath('data.month', '2026-10')
                ->assertJsonPath('data.totals', [
                    'stock_value' => 840000,
                    'low_stock_count' => 1,
                    'active_projects' => 3,
                    'purchases_waiting' => 1,
                    'material_cost_this_month' => 1740000,
                ])
                ->assertJsonCount(3, 'data.top_projects')
                ->assertJsonPath('data.top_projects.0.code', 'PRJ-A')
                ->assertJsonPath('data.top_projects.0.profit', 8040000)
                ->assertJsonPath('data.top_projects.0.margin_percent', 80.4)
                ->assertJsonPath('data.top_projects.1.code', 'PRJ-B')
                ->assertJsonPath('data.top_projects.1.profit', 3720000)
                ->assertJsonPath('data.top_projects.2.code', 'PRJ-D')
                ->assertJsonPath('data.top_projects.2.margin_percent', null)
                ->assertJsonCount(7, 'data.recent_movements')
                ->assertJsonPath('data.recent_movements.0.value_change', -360000)
                ->assertJsonMissingPath('data.low_stock');
        }
    }

    public function test_material_cost_this_month_only_counts_movements_dated_this_month(): void
    {
        [$a] = $this->seedScenario();

        $this->travelTo('2026-11-03 09:00:00');
        Sanctum::actingAs($this->owner);
        $this->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.month', '2026-11')
            ->assertJsonPath('data.totals.material_cost_this_month', 0);

        // 5 m at avg 12.000 issued on 3 November.
        $this->stock('stock-outs', $a, '5', '2026-11-03');
        Sanctum::actingAs($this->owner);
        $this->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.totals.material_cost_this_month', 60000)
            ->assertJsonPath('data.totals.stock_value', 780000);
    }

    public function test_gudang_gets_lists_without_any_money(): void
    {
        $this->seedScenario();

        Sanctum::actingAs($this->gudang);
        $response = $this->getJson('/api/v1/dashboard');
        $this->assertNoMoneyKeys($response);
        $response->assertJsonPath('data.view', 'gudang')
            ->assertJsonMissingPath('data.totals')
            ->assertJsonMissingPath('data.top_projects')
            ->assertJsonMissingPath('data.recent_movements')
            ->assertJsonPath('data.low_stock_count', 1)
            ->assertJsonPath('data.low_stock.0.name', 'Kabel NYM 2x1.5')
            ->assertJsonPath('data.low_stock.0.qty', '70.000')
            ->assertJsonPath('data.low_stock.0.min_stock', '100.000')
            ->assertJsonPath('data.low_stock.0.unit_symbol', 'm')
            ->assertJsonPath('data.purchases_waiting_count', 1)
            ->assertJsonPath('data.purchases_waiting.0.number', 'PB-DRAFT')
            ->assertJsonCount(4, 'data.recent_transactions');
    }

    public function test_empty_database_gives_zeros_and_empty_lists(): void
    {
        $this->cable->update(['min_stock' => '0']); // no minimum set: never low stock

        Sanctum::actingAs($this->owner);
        $this->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.totals', [
                'stock_value' => 0,
                'low_stock_count' => 0,
                'active_projects' => 0,
                'purchases_waiting' => 0,
                'material_cost_this_month' => 0,
            ])
            ->assertJsonPath('data.top_projects', [])
            ->assertJsonPath('data.recent_movements', []);

        Sanctum::actingAs($this->gudang);
        $this->getJson('/api/v1/dashboard')
            ->assertOk()
            ->assertJsonPath('data.low_stock', [])
            ->assertJsonPath('data.purchases_waiting', [])
            ->assertJsonPath('data.recent_transactions', []);
    }
}
