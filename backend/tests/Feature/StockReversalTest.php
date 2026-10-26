<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Enums\StockTransactionStatus;
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

/** docs/desain-v2.md B5.4: Owner cancels a stock-out or return document with reversal movements (B4.4). */
class StockReversalTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use RefreshDatabase;

    private User $owner;

    private User $gudang;

    private Project $project;

    private Product $cable;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create(['name' => 'Pak Owner']);
        $this->gudang = User::factory()->gudang()->create();
        $this->project = Project::factory()->create(['code' => 'PRJ-0003']);
        $this->cable = Product::factory()->create(['name' => 'Kabel NYM', 'unit_id' => Unit::factory()->create(['symbol' => 'mtr'])->id]);
        $this->pipe = Product::factory()->create(['name' => 'Pipa PVC']);
        DB::transaction(fn () => app(StockLedger::class)->apply([
            ['product_id' => $this->cable->id, 'qty' => '115', 'value' => 1322500],
            ['product_id' => $this->pipe->id, 'qty' => '12.5', 'value' => 125000],
        ], new MovementContext(MovementType::Opening, '2026-10-01', $this->owner->id)));
    }

    private function document(string $endpoint, array $items): int
    {
        Sanctum::actingAs($this->gudang);

        return $this->postJson("/api/v1/{$endpoint}", [
            'project_id' => $this->project->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-26',
            'items' => array_map(fn ($item) => ['product_id' => $item[0]->id, 'qty' => $item[1]], $items),
        ])->assertCreated()->json('data.id');
    }

    private function reverse(int $id, string $reason = 'Salah input proyek')
    {
        Sanctum::actingAs($this->owner);

        return $this->postJson("/api/v1/stock-transactions/{$id}/reverse", ['reason' => $reason]);
    }

    private function balance(Product $product): array
    {
        $balance = StockBalance::where('product_id', $product->id)->first();

        return [$balance->qty, $balance->stock_value];
    }

    public function test_owner_reverses_a_stock_out_and_stock_comes_back_exactly(): void
    {
        $id = $this->document('stock-outs', [[$this->cable, '25'], [$this->pipe, '2.5']]);
        $this->assertSame(['90.000', 1035000], $this->balance($this->cable));

        $this->reverse($id)
            ->assertOk()
            ->assertJsonPath('data.status', 'reversed')
            ->assertJsonPath('data.status_label', 'Dibatalkan')
            ->assertJsonPath('data.reversed_by', ['id' => $this->owner->id, 'name' => 'Pak Owner'])
            ->assertJsonPath('data.reverse_reason', 'Salah input proyek')
            ->assertJsonCount(2, 'data.lines')
            ->assertJsonPath('data.total_value', 312500);

        $this->assertSame(['115.000', 1322500], $this->balance($this->cable));
        $this->assertSame(['12.500', 125000], $this->balance($this->pipe));

        $originals = StockMovement::where('type', MovementType::ProjectOut)->orderBy('id')->get();
        $reversals = StockMovement::where('type', MovementType::Reversal)->orderBy('id')->get();
        $this->assertSame($originals->pluck('id')->all(), $reversals->pluck('reverses_movement_id')->all());
        $this->assertSame(['25.000', 287500, $this->project->id, $id, '2026-10-27', 'Pembatalan BK-000001: Salah input proyek'], [
            $reversals[0]->qty_change, $reversals[0]->value_change, $reversals[0]->project_id, $reversals[0]->stock_transaction_id,
            $reversals[0]->movement_date->toDateString(), $reversals[0]->notes,
        ]);
        $this->assertSame('Membatalkan Barang Keluar BK-000001 proyek PRJ-0003: Salah input proyek', AuditLog::where('action', AuditAction::STOCK_TRANSACTION_REVERSED)->sole()->summary);

        Sanctum::actingAs($this->gudang);
        $this->assertNoMoneyKeys($this->getJson("/api/v1/stock-transactions/{$id}"));
        $this->getJson("/api/v1/projects/{$this->project->id}/issued-items")->assertExactJson(['data' => []]);
        $this->assertSame([$id], array_column($this->getJson('/api/v1/stock-transactions?status=reversed')->json('data'), 'id'));
    }

    public function test_a_document_can_be_reversed_only_once(): void
    {
        $id = $this->document('stock-outs', [[$this->cable, '25']]);
        $this->reverse($id)->assertOk();

        $this->reverse($id)->assertStatus(422)->assertExactJson(['message' => 'Dokumen ini sudah dibatalkan.']);
        $this->assertSame(1, StockMovement::where('type', MovementType::Reversal)->count());
        $this->assertSame(['115.000', 1322500], $this->balance($this->cable));
    }

    public function test_owner_reverses_a_return_and_the_project_holds_the_goods_again(): void
    {
        $this->document('stock-outs', [[$this->cable, '25']]);
        $returnId = $this->document('stock-returns', [[$this->cable, '5']]);
        $this->assertSame(['95.000', 1092500], $this->balance($this->cable));

        $this->reverse($returnId, 'Ternyata belum dikembalikan')->assertOk()->assertJsonPath('data.status', 'reversed');

        $this->assertSame(['90.000', 1035000], $this->balance($this->cable));
        $this->assertSame([$this->cable->id => ['qty' => '25.000', 'value' => 287500]], app(StockLedger::class)->projectNet($this->project->id));
        $this->assertSame('Membatalkan Pengembalian RT-000002 proyek PRJ-0003: Ternyata belum dikembalikan', AuditLog::where('action', AuditAction::STOCK_TRANSACTION_REVERSED)->sole()->summary);
    }

    public function test_reversing_a_return_is_blocked_when_the_stock_was_used_again(): void
    {
        $this->document('stock-outs', [[$this->pipe, '2.5']]);
        $returnId = $this->document('stock-returns', [[$this->pipe, '2.5']]);
        $this->document('stock-outs', [[$this->pipe, '12.5']]);

        $this->reverse($returnId)
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Tidak bisa dibatalkan: stok Pipa PVC sudah terpakai. Sisa stok 0 '.$this->pipe->unit->symbol.'.']);
        $this->assertSame(StockTransactionStatus::Posted, StockTransaction::find($returnId)->status);
        $this->assertSame(0, StockMovement::where('type', MovementType::Reversal)->count());
    }

    public function test_reversing_a_stock_out_is_blocked_after_goods_came_back(): void
    {
        $outId = $this->document('stock-outs', [[$this->cable, '25'], [$this->pipe, '2.5']]);
        $this->document('stock-returns', [[$this->pipe, '1']]);

        $this->reverse($outId)
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Tidak bisa dibatalkan: sebagian Pipa PVC sudah dikembalikan dari proyek ini. Batalkan dokumen pengembaliannya dulu.']);
        $this->assertSame(0, StockMovement::where('type', MovementType::Reversal)->count());
        $this->assertSame(['90.000', 1035000], $this->balance($this->cable));
    }

    public function test_only_owner_with_a_reason_may_reverse(): void
    {
        $id = $this->document('stock-outs', [[$this->cable, '25']]);

        foreach (['gudang', 'finance'] as $role) {
            Sanctum::actingAs(User::factory()->state(['role' => $role])->create());
            $this->postJson("/api/v1/stock-transactions/{$id}/reverse", ['reason' => 'Salah input proyek'])->assertForbidden();
        }
        $this->reverse($id, 'abc')->assertStatus(422)->assertJsonPath('errors.reason.0', 'Alasan minimal 5 karakter.');
        $this->reverse($id, str_repeat('x', 301))->assertStatus(422)->assertJsonPath('errors.reason.0', 'Alasan maksimal 300 karakter.');

        $this->assertSame(StockTransactionStatus::Posted, StockTransaction::find($id)->status);
        $this->assertSame(['90.000', 1035000], $this->balance($this->cable));
    }
}
