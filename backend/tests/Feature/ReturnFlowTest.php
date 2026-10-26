<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Enums\ProjectStatus;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\Project;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\StockTransaction;
use App\Models\Unit;
use App\Models\User;
use App\Services\MovementContext;
use App\Services\StockLedger;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\AssertsNoMoneyKeys;
use Tests\TestCase;

/** docs/desain-v2.md B5.3 Pengembalian + GET /projects/{id}/issued-items. */
class ReturnFlowTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use RefreshDatabase;

    private User $gudang;

    private Project $project;

    private Product $cable;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->gudang = User::factory()->gudang()->create();
        $this->project = Project::factory()->create(['code' => 'PRJ-0003']);
        $this->cable = Product::factory()->create(['name' => 'Kabel NYM', 'unit_id' => Unit::factory()->create(['symbol' => 'mtr'])->id]);
        $this->pipe = Product::factory()->create(['name' => 'Pipa PVC']);
    }

    private function ledger(MovementType $type, array $lines, ?int $projectId = null): void
    {
        DB::transaction(fn () => app(StockLedger::class)->apply($lines, new MovementContext($type, '2026-10-20', $this->gudang->id, $projectId)));
    }

    private function issue(Product $product, string $qty, ?Project $project = null): void
    {
        Sanctum::actingAs($this->gudang);
        $this->postJson('/api/v1/stock-outs', [
            'project_id' => ($project ?? $this->project)->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-21',
            'items' => [['product_id' => $product->id, 'qty' => $qty]],
        ])->assertCreated();
    }

    private function giveBack(Product $product, string $qty, ?Project $project = null)
    {
        Sanctum::actingAs($this->gudang);

        return $this->postJson('/api/v1/stock-returns', [
            'project_id' => ($project ?? $this->project)->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $product->id, 'qty' => $qty]],
        ]);
    }

    private function balance(Product $product): array
    {
        $balance = StockBalance::where('product_id', $product->id)->first();

        return [$balance->qty, $balance->stock_value, $balance->avg_cost];
    }

    public function test_return_is_valued_at_the_project_issue_cost_not_the_current_average(): void
    {
        $this->ledger(MovementType::Opening, [['product_id' => $this->cable->id, 'qty' => '10', 'value' => 100000]]);
        $this->issue($this->cable, '6'); // 6 x 10.000 = 60.000
        $this->ledger(MovementType::PurchaseIn, [['product_id' => $this->cable->id, 'qty' => '10', 'value' => 140000]]);
        $this->assertSame(['14.000', 180000, '12857.1428'], $this->balance($this->cable));

        $response = $this->giveBack($this->cable, '2')
            ->assertCreated()
            ->assertJsonPath('data.number', 'RT-000002')
            ->assertJsonPath('data.type', 'project_return')
            ->assertJsonPath('data.type_label', 'Pengembalian')
            ->assertJsonPath('data.person_name', 'Budi')
            ->assertJsonPath('data.lines.0.qty', '2.000');
        $this->assertNoMoneyKeys($response);

        $this->assertSame(['16.000', 200000, '12500.0000'], $this->balance($this->cable));
        $movement = StockMovement::where('type', MovementType::ProjectReturn)->sole();
        $this->assertSame(['2.000', 20000, $this->project->id], [$movement->qty_change, $movement->value_change, $movement->project_id]);
        $this->assertSame('Pengembalian RT-000002 dari proyek PRJ-0003 (1 barang) oleh Budi', AuditLog::where('action', AuditAction::STOCK_RETURN_CREATED)->sole()->summary);

        Sanctum::actingAs(User::factory()->owner()->create());
        $this->getJson("/api/v1/stock-transactions/{$movement->stock_transaction_id}")
            ->assertJsonPath('data.lines.0.value', 20000)
            ->assertJsonPath('data.total_value', 20000);
    }

    public function test_returning_more_than_the_project_took_is_rejected(): void
    {
        $this->ledger(MovementType::Opening, [
            ['product_id' => $this->cable->id, 'qty' => '10', 'value' => 100000],
            ['product_id' => $this->pipe->id, 'qty' => '5', 'value' => 50000],
        ]);
        $this->issue($this->cable, '6');
        $this->issue($this->pipe, '1', Project::factory()->create()); // taken by ANOTHER project

        $this->giveBack($this->cable, '6.001')
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Jumlah pengembalian Kabel NYM melebihi barang yang diambil proyek ini (6 mtr).']);
        $this->giveBack($this->pipe, '1')
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Jumlah pengembalian Pipa PVC melebihi barang yang diambil proyek ini (0 '.$this->pipe->unit->symbol.').']);

        $this->assertSame(0, StockTransaction::where('type', 'project_return')->count());
        $this->assertSame(['4.000', 40000, '10000.0000'], $this->balance($this->cable));
    }

    public function test_finished_project_may_return_cancelled_project_may_not(): void
    {
        $this->ledger(MovementType::Opening, [['product_id' => $this->cable->id, 'qty' => '10', 'value' => 100000]]);
        $this->issue($this->cable, '6');
        $this->project->update(['status' => ProjectStatus::Selesai]);

        $this->giveBack($this->cable, '1')->assertCreated();

        $this->project->update(['status' => ProjectStatus::Batal]);
        $this->giveBack($this->cable, '1')
            ->assertStatus(422)
            ->assertJsonPath('errors.project_id.0', 'Proyek tidak ditemukan atau berstatus Batal.');

        Sanctum::actingAs(User::factory()->finance()->create());
        $this->postJson('/api/v1/stock-returns', [])->assertForbidden();
    }

    public function test_full_return_takes_exactly_the_remaining_issue_value(): void
    {
        // 3 m worth 10.000: issue 1 + 1 = 3.333 + 3.334; return 1 = 3.334 (half up), return the last 1 = exactly 3.333.
        $this->ledger(MovementType::Opening, [['product_id' => $this->cable->id, 'qty' => '3', 'value' => 10000]]);
        $this->issue($this->cable, '1');
        $this->issue($this->cable, '1');

        $this->giveBack($this->cable, '1')->assertCreated();
        $this->giveBack($this->cable, '1')->assertCreated();

        $this->assertSame([3334, 3333], StockMovement::where('type', MovementType::ProjectReturn)->orderBy('id')->pluck('value_change')->all());
        $this->assertSame(['3.000', 10000, '3333.3333'], $this->balance($this->cable));
        $this->assertSame([-3333, -3334], StockMovement::where('type', MovementType::ProjectOut)->orderBy('id')->pluck('value_change')->all());
        $this->assertSame([$this->cable->id => ['qty' => '0.000', 'value' => 0]], app(StockLedger::class)->projectNet($this->project->id));
    }

    public function test_issued_items_lists_what_the_project_still_holds(): void
    {
        $this->ledger(MovementType::Opening, [
            ['product_id' => $this->cable->id, 'qty' => '10', 'value' => 100000],
            ['product_id' => $this->pipe->id, 'qty' => '5', 'value' => 50000],
        ]);
        $this->issue($this->cable, '6');
        $this->issue($this->pipe, '2.5');
        $this->giveBack($this->cable, '2')->assertCreated();
        $this->giveBack($this->pipe, '2.5')->assertCreated();
        $other = Project::factory()->create();

        Sanctum::actingAs($this->gudang);
        $response = $this->getJson("/api/v1/projects/{$this->project->id}/issued-items")
            ->assertOk()
            ->assertExactJson(['data' => [[
                'product' => ['id' => $this->cable->id, 'sku' => $this->cable->sku, 'name' => 'Kabel NYM', 'unit_symbol' => 'mtr', 'is_active' => true],
                'qty' => '4.000',
            ]]]);
        $this->assertNoMoneyKeys($response);
        $this->getJson("/api/v1/projects/{$other->id}/issued-items")->assertOk()->assertExactJson(['data' => []]);

        Sanctum::actingAs(User::factory()->finance()->create());
        $this->getJson("/api/v1/projects/{$this->project->id}/issued-items")
            ->assertOk()
            ->assertJsonPath('data.0.value', 40000);
    }
}
