<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * docs/desain-v2.md B4.7 — the exact worked example, done through the real API:
 * Kabel NYM 2x1.5 (m). Project A: contract 10.000.000, material 460.000, other costs 1.500.000 → profit 8.040.000 (80,4 %).
 * Project B: contract 5.000.000, material 1.280.000 → profit 3.720.000 (74,4 %). Stock left: 70 m worth 840.000.
 */
class ProjectProfitScenarioTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $gudang;

    private User $finance;

    private Product $cable;

    private Project $a;

    private Project $b;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create();
        $this->gudang = User::factory()->gudang()->create();
        $this->finance = User::factory()->finance()->create();
        $this->cable = Product::factory()->create(['name' => 'Kabel NYM 2x1.5', 'unit_id' => Unit::factory()->create(['symbol' => 'm'])->id]);
        $this->a = Project::factory()->create(['code' => 'PRJ-A', 'contract_value' => 10000000]);
        $this->b = Project::factory()->create(['code' => 'PRJ-B', 'contract_value' => 5000000]);
    }

    private function buy(string $qty, int $price): void
    {
        $purchase = Purchase::factory()->withItem($this->cable, $qty, $price)->create();
        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$purchase->id}/receive")->assertOk();
    }

    private function stock(string $path, Project $project, string $qty): int
    {
        Sanctum::actingAs($this->gudang);

        return $this->postJson("/api/v1/{$path}", [
            'project_id' => $project->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->cable->id, 'qty' => $qty]],
        ])->assertCreated()->json('data.id');
    }

    /** Steps 1–7 of B4.7 plus the 1.500.000 other cost of project A. Returns the id of the last stock-out (step 7). */
    private function runScenario(): int
    {
        $this->buy('100', 10000);              // 1: Q 100, V 1.000.000, avg 10.000
        $this->buy('100', 13000);              // 2: Q 200, V 2.300.000, avg 11.500
        $this->stock('stock-outs', $this->a, '50');     // 3: −575.000
        $this->stock('stock-outs', $this->b, '80');     // 4: −920.000
        $this->stock('stock-returns', $this->a, '10');  // 5: +115.000 (at A's issue cost)
        $this->buy('20', 14000);               // 6: Q 100, V 1.200.000, avg 12.000
        $last = $this->stock('stock-outs', $this->b, '30'); // 7: −360.000

        Sanctum::actingAs($this->finance);
        $this->postJson("/api/v1/projects/{$this->a->id}/costs", ['cost_date' => '2026-10-27', 'description' => 'Upah tukang', 'amount' => 1500000])->assertCreated();

        return $last;
    }

    public function test_b47_worked_example_gives_the_exact_numbers(): void
    {
        $this->runScenario();

        $values = StockMovement::where('product_id', $this->cable->id)->orderBy('id')->pluck('value_change')->all();
        $this->assertSame([1000000, 1300000, -575000, -920000, 115000, 280000, -360000], $values);

        $balance = StockBalance::where('product_id', $this->cable->id)->first();
        $this->assertSame(['70.000', 840000, '12000.0000'], [$balance->qty, $balance->stock_value, $balance->avg_cost]);

        Sanctum::actingAs($this->finance);
        $this->getJson("/api/v1/projects/{$this->a->id}")
            ->assertOk()
            ->assertJsonPath('data.contract_value', 10000000)
            ->assertJsonPath('data.summary', ['material_cost' => 460000, 'other_costs' => 1500000, 'profit' => 8040000, 'margin_percent' => 80.4]);

        Sanctum::actingAs($this->owner);
        $this->getJson("/api/v1/projects/{$this->b->id}")
            ->assertOk()
            ->assertJsonPath('data.summary', ['material_cost' => 1280000, 'other_costs' => 0, 'profit' => 3720000, 'margin_percent' => 74.4]);

        $report = $this->getJson('/api/v1/reports/project-profit')->assertOk();
        $report->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.code', 'PRJ-A')
            ->assertJsonPath('data.0.profit', 8040000)
            ->assertJsonPath('data.1.code', 'PRJ-B')
            ->assertJsonPath('data.1.profit', 3720000)
            ->assertJsonPath('totals', [
                'contract_value' => 15000000,
                'material_cost' => 1740000,
                'other_costs' => 1500000,
                'profit' => 11760000,
                'margin_percent' => 78.4,
            ]);

        $this->getJson("/api/v1/reports/projects/{$this->a->id}/materials")
            ->assertOk()
            ->assertJsonPath('project.code', 'PRJ-A')
            ->assertJsonPath('data.0.product.name', 'Kabel NYM 2x1.5')
            ->assertJsonPath('data.0.product.unit_symbol', 'm')
            ->assertJsonPath('data.0.qty_out', '50.000')
            ->assertJsonPath('data.0.qty_returned', '10.000')
            ->assertJsonPath('data.0.net_qty', '40.000')
            ->assertJsonPath('data.0.net_value', 460000)
            ->assertJsonPath('totals.net_value', 460000);

        $this->getJson("/api/v1/reports/projects/{$this->b->id}/materials")
            ->assertOk()
            ->assertJsonPath('data.0.qty_out', '110.000')
            ->assertJsonPath('data.0.qty_returned', '0.000')
            ->assertJsonPath('data.0.net_qty', '110.000')
            ->assertJsonPath('data.0.net_value', 1280000);

        // Conservation (B4.7): purchases − net material to projects = stock value left.
        $this->assertSame(2580000 - (460000 + 1280000), $balance->stock_value);
    }

    public function test_reversing_a_stock_out_takes_it_out_of_the_project_cost(): void
    {
        $last = $this->runScenario();

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-transactions/{$last}/reverse", ['reason' => 'Salah input proyek'])->assertOk();

        $this->getJson("/api/v1/projects/{$this->b->id}")
            ->assertJsonPath('data.summary', ['material_cost' => 920000, 'other_costs' => 0, 'profit' => 4080000, 'margin_percent' => 81.6]);

        // The reversal counts with the stock-out it cancels: qty_out goes back to 80.
        $this->getJson("/api/v1/reports/projects/{$this->b->id}/materials")
            ->assertJsonPath('data.0.qty_out', '80.000')
            ->assertJsonPath('data.0.net_qty', '80.000')
            ->assertJsonPath('data.0.net_value', 920000);

        // Project A is not touched.
        $this->getJson("/api/v1/projects/{$this->a->id}")->assertJsonPath('data.summary.profit', 8040000);
    }
}
