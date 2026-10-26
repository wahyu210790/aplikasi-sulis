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

/** docs/desain-v2.md B5.2 Barang Keluar + GET /stock-transactions (list/show). */
class StockOutFlowTest extends TestCase
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
        $this->gudang = User::factory()->gudang()->create(['name' => 'Andi']);
        $this->project = Project::factory()->create(['code' => 'PRJ-0003', 'name' => 'Gedung X']);
        $this->cable = Product::factory()->create(['sku' => 'KBL-001', 'name' => 'Kabel NYM', 'unit_id' => Unit::factory()->create(['symbol' => 'mtr'])->id]);
        $this->pipe = Product::factory()->create(['sku' => 'PPA-001', 'name' => 'Pipa PVC', 'unit_id' => Unit::factory()->create(['symbol' => 'btg'])->id]);
        $this->opening([[$this->cable, '115', 1322500], [$this->pipe, '12.5', 125000]]);
    }

    /** @param list<array{0: Product, 1: string, 2: int}> $rows [product, qty, value] */
    private function opening(array $rows): void
    {
        DB::transaction(fn () => app(StockLedger::class)->apply(
            array_map(fn ($row) => ['product_id' => $row[0]->id, 'qty' => $row[1], 'value' => $row[2]], $rows),
            new MovementContext(MovementType::Opening, '2026-10-01', User::factory()->owner()->create()->id),
        ));
    }

    private function body(array $overrides = []): array
    {
        return [
            'project_id' => $this->project->id,
            'person_name' => ' Budi (teknisi) ',
            'transaction_date' => '2026-10-26',
            'notes' => 'Lantai 2',
            'items' => [
                ['product_id' => $this->cable->id, 'qty' => '25'],
                ['product_id' => $this->pipe->id, 'qty' => '2.5'],
            ],
            ...$overrides,
        ];
    }

    private function balance(Product $product): array
    {
        $balance = StockBalance::where('product_id', $product->id)->first();

        return [$balance->qty, $balance->stock_value];
    }

    public function test_gudang_issues_a_two_item_document_to_a_project(): void
    {
        Sanctum::actingAs($this->gudang);

        $response = $this->postJson('/api/v1/stock-outs', $this->body())
            ->assertCreated()
            ->assertJsonPath('data.number', 'BK-000001')
            ->assertJsonPath('data.type', 'project_out')
            ->assertJsonPath('data.type_label', 'Barang Keluar')
            ->assertJsonPath('data.status', 'posted')
            ->assertJsonPath('data.status_label', 'Tercatat')
            ->assertJsonPath('data.project', ['id' => $this->project->id, 'code' => 'PRJ-0003', 'name' => 'Gedung X'])
            ->assertJsonPath('data.person_name', 'Budi (teknisi)')
            ->assertJsonPath('data.transaction_date', '2026-10-26')
            ->assertJsonPath('data.created_by', ['id' => $this->gudang->id, 'name' => 'Andi'])
            ->assertJsonPath('data.lines.0.product', ['id' => $this->cable->id, 'sku' => 'KBL-001', 'name' => 'Kabel NYM', 'unit_symbol' => 'mtr'])
            ->assertJsonPath('data.lines.0.qty', '25.000')
            ->assertJsonPath('data.lines.1.qty', '2.500');
        $this->assertNoMoneyKeys($response);

        // 115 m / 1.322.500 -> out 25 at average 11.500 = 287.500. 12,5 btg / 125.000 -> out 2,5 = 25.000.
        $this->assertSame(['90.000', 1035000], $this->balance($this->cable));
        $this->assertSame(['10.000', 100000], $this->balance($this->pipe));

        $document = StockTransaction::sole();
        $movements = StockMovement::where('stock_transaction_id', $document->id)->orderBy('id')->get();
        $this->assertSame([MovementType::ProjectOut, '-25.000', -287500, $this->project->id, $this->gudang->id, '2026-10-26'], [
            $movements[0]->type, $movements[0]->qty_change, $movements[0]->value_change, $movements[0]->project_id, $movements[0]->created_by, $movements[0]->movement_date->toDateString(),
        ]);
        $this->assertSame('Barang keluar BK-000001 ke proyek PRJ-0003 (2 barang) oleh Budi (teknisi)', AuditLog::where('action', AuditAction::STOCK_OUT_CREATED)->sole()->summary);

        foreach (['owner', 'finance'] as $role) {
            Sanctum::actingAs(User::factory()->state(['role' => $role])->create());
            $this->getJson("/api/v1/stock-transactions/{$document->id}")
                ->assertOk()
                ->assertJsonPath('data.lines.0.value', 287500)
                ->assertJsonPath('data.lines.1.value', 25000)
                ->assertJsonPath('data.total_value', 312500);
        }
    }

    public function test_project_person_date_and_items_are_required(): void
    {
        Sanctum::actingAs($this->gudang);

        $errors = $this->postJson('/api/v1/stock-outs', ['person_name' => ' B ', 'transaction_date' => '2026-09-26', 'items' => []])
            ->assertStatus(422)->json('errors');

        $this->assertEquals([
            'project_id' => ['Proyek wajib diisi.'],
            'person_name' => ['Nama orang minimal 2 karakter.'],
            'transaction_date' => ['Tanggal paling lama 30 hari ke belakang (paling awal 27-09-2026).'],
            'items' => ['Tambahkan minimal 1 barang.'],
        ], $errors);
        $this->assertSame(0, StockTransaction::count());
    }

    public function test_only_active_projects_and_active_products_are_accepted(): void
    {
        Sanctum::actingAs($this->gudang);
        $this->pipe->update(['is_active' => false]);

        foreach ([ProjectStatus::Selesai, ProjectStatus::Batal] as $status) {
            $project = Project::factory()->status($status)->create();
            $this->postJson('/api/v1/stock-outs', $this->body(['project_id' => $project->id]))
                ->assertStatus(422)
                ->assertJsonPath('errors.project_id.0', 'Proyek tidak ditemukan atau tidak berstatus Aktif.');
        }
        $this->postJson('/api/v1/stock-outs', $this->body())
            ->assertStatus(422)
            ->assertJsonValidationErrors(['items.1.product_id' => 'Barang tidak ditemukan atau sudah nonaktif.']);

        $this->assertSame(0, StockMovement::where('type', MovementType::ProjectOut)->count());
    }

    public function test_insufficient_stock_rolls_back_the_whole_document(): void
    {
        Sanctum::actingAs($this->gudang);

        $this->postJson('/api/v1/stock-outs', $this->body(['items' => [
            ['product_id' => $this->cable->id, 'qty' => '25'],
            ['product_id' => $this->pipe->id, 'qty' => '12.501'],
        ]]))->assertStatus(422)->assertExactJson(['message' => 'Stok Pipa PVC tidak cukup. Sisa stok: 12,5 btg.']);

        $this->assertSame(0, StockTransaction::count());
        $this->assertSame(0, StockMovement::where('type', MovementType::ProjectOut)->count());
        $this->assertSame(0, AuditLog::where('action', AuditAction::STOCK_OUT_CREATED)->count());
        $this->assertSame(['115.000', 1322500], $this->balance($this->cable));

        // Taking exactly everything is fine and leaves no value behind.
        $this->postJson('/api/v1/stock-outs', $this->body(['items' => [['product_id' => $this->pipe->id, 'qty' => '12.5']]]))->assertCreated();
        $this->assertSame(['0.000', 0], $this->balance($this->pipe));
    }

    public function test_finance_cannot_issue_stock(): void
    {
        Sanctum::actingAs(User::factory()->finance()->create());

        $this->postJson('/api/v1/stock-outs', $this->body())->assertForbidden();
        $this->assertSame(0, StockTransaction::count());
    }

    public function test_list_filters_and_gudang_sees_no_money(): void
    {
        Sanctum::actingAs($this->gudang);
        $other = Project::factory()->create();
        $first = $this->postJson('/api/v1/stock-outs', $this->body(['transaction_date' => '2026-10-20']))->json('data.id');
        $second = $this->postJson('/api/v1/stock-outs', $this->body([
            'project_id' => $other->id, 'person_name' => 'Joko', 'items' => [['product_id' => $this->cable->id, 'qty' => '1']],
        ]))->json('data.id');

        $list = $this->getJson('/api/v1/stock-transactions')->assertOk();
        $this->assertNoMoneyKeys($list);
        $this->assertSame([$second, $first], array_column($list->json('data'), 'id'));
        $this->assertSame([1, 2], array_column($list->json('data'), 'lines_count'));

        $ids = fn (string $query) => array_column($this->getJson('/api/v1/stock-transactions?'.$query)->assertOk()->json('data'), 'id');
        $this->assertSame([$first], $ids("project_id={$this->project->id}"));
        $this->assertSame([$first], $ids("product_id={$this->pipe->id}"));
        $this->assertSame([$second], $ids('search=joko'));
        $this->assertSame([$first], $ids('search=BK-000001'));
        $this->assertSame([$first], $ids('date_from=2026-10-01&date_to=2026-10-25'));
        $this->assertSame([$second, $first], $ids('type=project_out&status=posted'));
        $this->assertSame([], $ids('type=project_return'));
        $this->getJson('/api/v1/stock-transactions/999')->assertNotFound();

        Sanctum::actingAs(User::factory()->owner()->create());
        $this->getJson('/api/v1/stock-transactions')->assertJsonPath('data.0.total_value', 11500)->assertJsonPath('data.1.total_value', 312500);
    }
}
