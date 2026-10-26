<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Enums\ProjectStatus;
use App\Exceptions\BusinessRuleException;
use App\Models\Product;
use App\Models\Project;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Services\MovementContext;
use App\Services\StockLedger;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use LogicException;
use Tests\TestCase;

/** docs/desain-v2.md B4 — every formula, invariant, rounding, reversal guard. */
class StockLedgerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Product $cable;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->owner()->create();
        $unit = Unit::factory()->create(['name' => 'meter', 'symbol' => 'm']);
        $this->cable = Product::factory()->create(['sku' => 'KBL-NYM-2X15', 'name' => 'Kabel NYM 2x1.5', 'unit_id' => $unit->id]);
    }

    private function ledger(MovementType $type, array $lines, ?Project $project = null, ?string $notes = null): Collection
    {
        return DB::transaction(fn () => app(StockLedger::class)->apply(
            $lines,
            new MovementContext($type, '2026-10-20', $this->user->id, $project?->id, null, $notes),
        ));
    }

    private function buy(string $qty, int $value, ?Product $product = null): StockMovement
    {
        return $this->ledger(MovementType::PurchaseIn, [['product_id' => ($product ?? $this->cable)->id, 'qty' => $qty, 'value' => $value]])->first();
    }

    private function out(Project $project, string $qty, ?Product $product = null): StockMovement
    {
        return $this->ledger(MovementType::ProjectOut, [['product_id' => ($product ?? $this->cable)->id, 'qty' => $qty]], $project)->first();
    }

    private function giveBack(Project $project, string $qty, ?Product $product = null): StockMovement
    {
        return $this->ledger(MovementType::ProjectReturn, [['product_id' => ($product ?? $this->cable)->id, 'qty' => $qty]], $project)->first();
    }

    private function reverse(StockMovement $movement): StockMovement
    {
        return $this->ledger(MovementType::Reversal, [['movement' => $movement]])->first();
    }

    private function assertBalance(string $qty, int $value, string $avg, ?Product $product = null): void
    {
        $balance = StockBalance::where('product_id', ($product ?? $this->cable)->id)->first();
        $this->assertSame([$qty, $value, $avg], [$balance->qty, $balance->stock_value, $balance->avg_cost]);
    }

    private function assertRejected(string $message, callable $action): void
    {
        try {
            $action();
            $this->fail('Expected BusinessRuleException: '.$message);
        } catch (BusinessRuleException $e) {
            $this->assertSame($message, $e->getMessage());
        }
    }

    public function test_weighted_average_follows_the_b47_table_step_by_step(): void
    {
        $a = Project::factory()->create();
        $b = Project::factory()->create();

        $this->assertSame(1000000, $this->buy('100', 1000000)->value_change);
        $this->assertBalance('100.000', 1000000, '10000.0000');
        $this->buy('100', 1300000);
        $this->assertBalance('200.000', 2300000, '11500.0000');
        $this->assertSame(-575000, $this->out($a, '50')->value_change);
        $this->assertBalance('150.000', 1725000, '11500.0000');
        $this->assertSame(-920000, $this->out($b, '80')->value_change);
        $this->assertBalance('70.000', 805000, '11500.0000');
        $this->assertSame(115000, $this->giveBack($a, '10')->value_change);
        $this->assertBalance('80.000', 920000, '11500.0000');
        $this->buy('20', 280000);
        $this->assertBalance('100.000', 1200000, '12000.0000');
        $last = $this->out($b, '30');
        $this->assertSame(-360000, $last->value_change);
        $this->assertBalance('70.000', 840000, '12000.0000');

        // Movement *_after fields mirror the balance.
        $this->assertSame(['70.000', 840000, '12000.0000', '12000.0000'], [$last->qty_after, $last->value_after, $last->avg_cost_after, $last->unit_cost]);
        // B4.6 derived material cost per project, and conservation: purchases − net material = stock value.
        $this->assertSame(460000, -(int) StockMovement::where('project_id', $a->id)->sum('value_change'));
        $this->assertSame(1280000, -(int) StockMovement::where('project_id', $b->id)->sum('value_change'));
        $this->assertSame(2580000 - 1740000, StockBalance::where('product_id', $this->cable->id)->value('stock_value'));
        $this->assertTrue(StockBalance::where('product_id', $this->cable->id)->value('has_cost'));
    }

    public function test_rounding_scenario_leaves_no_residue(): void
    {
        $project = Project::factory()->create();
        $this->buy('3', 3000);
        $this->buy('1', 1001);
        $this->assertBalance('4.000', 4001, '1000.2500');

        $this->assertSame(-1000, $this->out($project, '1')->value_change);
        $this->assertBalance('3.000', 3001, '1000.3333');
        $this->assertSame(-3001, $this->out($project, '3')->value_change);
        // Q' = 0 => V' = 0; the last known average is kept.
        $this->assertBalance('0.000', 0, '1000.3333');
    }

    public function test_decimal_quantities_are_exact(): void
    {
        $project = Project::factory()->create();
        $this->buy('12.5', 125000);
        $this->assertSame(-25000, $this->out($project, '2.5')->value_change);
        $this->assertBalance('10.000', 100000, '10000.0000');
        $this->buy('0.5', 1001);
        $this->assertBalance('10.500', 101001, '9619.1428');
        $this->assertSame(-3203, $this->out($project, '0.333')->value_change);
        $this->assertBalance('10.167', 97798, '9619.1600');
    }

    public function test_out_more_than_stock_is_rejected_and_nothing_is_written(): void
    {
        $project = Project::factory()->create();
        $this->buy('70', 840000);

        $this->assertRejected('Stok Kabel NYM 2x1.5 tidak cukup. Sisa stok: 70 m.', fn () => $this->out($project, '70.001'));
        $this->assertBalance('70.000', 840000, '12000.0000');
        $this->assertSame(1, StockMovement::count());
    }

    public function test_one_bad_line_rolls_back_the_whole_document(): void
    {
        $project = Project::factory()->create();
        $pipe = Product::factory()->create(['name' => 'Pipa PVC']);
        $this->buy('10', 100000);
        $this->buy('5', 50000, $pipe);

        try {
            $this->ledger(MovementType::ProjectOut, [
                ['product_id' => $this->cable->id, 'qty' => '4'],
                ['product_id' => $pipe->id, 'qty' => '6'],
            ], $project);
            $this->fail('Expected BusinessRuleException');
        } catch (BusinessRuleException $e) {
            $this->assertStringStartsWith('Stok Pipa PVC tidak cukup. Sisa stok: 5 ', $e->getMessage());
        }

        $this->assertBalance('10.000', 100000, '10000.0000');
        $this->assertSame(0, StockMovement::where('type', MovementType::ProjectOut)->count());
    }

    public function test_lines_are_written_in_product_id_order(): void
    {
        $project = Project::factory()->create();
        $pipe = Product::factory()->create();
        $this->buy('10', 100000);
        $this->buy('10', 100000, $pipe);

        $movements = $this->ledger(MovementType::ProjectOut, [
            ['product_id' => $pipe->id, 'qty' => '1'],
            ['product_id' => $this->cable->id, 'qty' => '1'],
        ], $project);

        $this->assertSame([$this->cable->id, $pipe->id], $movements->pluck('product_id')->all());
        $this->assertTrue($movements[0]->id < $movements[1]->id);
    }

    public function test_balance_is_read_with_a_row_lock_and_never_from_a_stale_model(): void
    {
        $this->assertTrue(StockLedger::lockedBalanceQuery($this->cable->id)->getQuery()->lock);

        $project = Project::factory()->create();
        $this->buy('100', 1000000);
        $stale = $this->cable->stockBalance()->first();
        $this->out($project, '60');

        // Two users both saw 100 on screen; the second document must still fail.
        $this->assertSame('100.000', $stale->qty);
        $this->assertRejected('Stok Kabel NYM 2x1.5 tidak cukup. Sisa stok: 40 m.', fn () => $this->out($project, '60'));
        $this->assertBalance('40.000', 400000, '10000.0000');
    }

    public function test_return_is_valued_at_the_project_issue_cost_not_today_average(): void
    {
        $project = Project::factory()->create();
        $this->buy('10', 100000);
        $this->out($project, '10');
        $this->buy('10', 200000);
        $this->assertBalance('10.000', 200000, '20000.0000');

        $this->assertSame(40000, $this->giveBack($project, '4')->value_change);
        $this->assertBalance('14.000', 240000, '17142.8571');
        // Returning the rest takes exactly the remaining net value.
        $this->assertSame(60000, $this->giveBack($project, '6')->value_change);
        $this->assertSame(0, -(int) StockMovement::where('project_id', $project->id)->sum('value_change'));
    }

    public function test_return_more_than_the_project_took_is_rejected(): void
    {
        $a = Project::factory()->create();
        $b = Project::factory()->create();
        $this->buy('100', 1000000);
        $this->out($a, '50');
        $this->out($b, '30');
        $this->giveBack($a, '20');

        $this->assertRejected(
            'Jumlah pengembalian Kabel NYM 2x1.5 melebihi barang yang diambil proyek ini (30 m).',
            fn () => $this->giveBack($a, '30.5'),
        );
        $other = Project::factory()->create();
        $this->assertRejected(
            'Jumlah pengembalian Kabel NYM 2x1.5 melebihi barang yang diambil proyek ini (0 m).',
            fn () => $this->giveBack($other, '1'),
        );
        $this->assertSame(['qty' => '30.000', 'value' => 300000], app(StockLedger::class)->projectNet($a->id)[$this->cable->id]);
    }

    public function test_opname_in_uses_last_known_average_or_zero(): void
    {
        $this->assertSame(0, $this->ledger(MovementType::OpnameIn, [['product_id' => $this->cable->id, 'qty' => '5']])->first()->value_change);
        $this->assertBalance('5.000', 0, '0.0000');
        $this->assertFalse(StockBalance::where('product_id', $this->cable->id)->value('has_cost'));

        $project = Project::factory()->create();
        $this->buy('5', 60000);
        $this->out($project, '10');
        $this->assertBalance('0.000', 0, '6000.0000');
        $this->assertSame(12000, $this->ledger(MovementType::OpnameIn, [['product_id' => $this->cable->id, 'qty' => '2']])->first()->value_change);
        $this->assertSame(-6000, $this->ledger(MovementType::OpnameOut, [['product_id' => $this->cable->id, 'qty' => '1']])->first()->value_change);
        $this->assertBalance('1.000', 6000, '6000.0000');
    }

    public function test_opening_only_for_products_without_movements(): void
    {
        $opening = $this->ledger(MovementType::Opening, [['product_id' => $this->cable->id, 'qty' => '10', 'value' => 0]])->first();
        $this->assertSame('0.0000', $opening->unit_cost);
        $this->assertTrue(StockBalance::where('product_id', $this->cable->id)->value('has_cost'));

        $this->assertRejected(
            'Stok awal KBL-NYM-2X15 sudah pernah diisi atau barang sudah punya transaksi.',
            fn () => $this->ledger(MovementType::Opening, [['product_id' => $this->cable->id, 'qty' => '1', 'value' => 100]]),
        );
        $pipe = Product::factory()->create(['sku' => 'PPA-001']);
        $this->buy('1', 100, $pipe);
        $this->assertRejected(
            'Stok awal PPA-001 sudah pernah diisi atau barang sudah punya transaksi.',
            fn () => $this->ledger(MovementType::Opening, [['product_id' => $pipe->id, 'qty' => '1', 'value' => 100]]),
        );
    }

    public function test_inactive_products_and_project_status_rules(): void
    {
        $project = Project::factory()->create();
        $this->buy('10', 100000);
        $out = $this->out($project, '5');
        $this->cable->update(['is_active' => false]);

        $this->assertRejected(
            'Barang KBL-NYM-2X15 (Kabel NYM 2x1.5) sudah nonaktif dan tidak bisa dipakai untuk transaksi baru.',
            fn () => $this->out($project, '1'),
        );
        $this->assertRejected(
            'Barang KBL-NYM-2X15 (Kabel NYM 2x1.5) sudah nonaktif dan tidak bisa dipakai untuk transaksi baru.',
            fn () => $this->buy('1', 10000),
        );
        // Reversal and opname are allowed for inactive products (B4.5).
        $this->ledger(MovementType::OpnameIn, [['product_id' => $this->cable->id, 'qty' => '1']]);
        $this->assertSame('5.000', $this->reverse($out)->qty_change);
        $this->cable->update(['is_active' => true]);
        $this->out($project, '2');

        $project->update(['status' => ProjectStatus::Selesai]);
        $this->assertRejected(
            "Proyek {$project->code} berstatus Selesai. Barang keluar hanya bisa ke proyek berstatus Aktif.",
            fn () => $this->out($project, '1'),
        );
        $this->assertSame(10000, $this->giveBack($project, '1')->value_change);

        $project->update(['status' => ProjectStatus::Batal]);
        $this->assertRejected(
            "Proyek {$project->code} berstatus Batal. Pengembalian hanya bisa ke proyek berstatus Aktif atau Selesai.",
            fn () => $this->giveBack($project, '1'),
        );
    }

    public function test_reversal_is_the_exact_negation_and_copies_the_project(): void
    {
        $project = Project::factory()->create();
        $this->buy('3', 3000);
        $this->buy('1', 1001);
        $out = $this->out($project, '1');

        $reversal = $this->reverse($out);
        $this->assertSame(MovementType::Reversal, $reversal->type);
        $this->assertSame(['1.000', 1000, $project->id, $out->id], [$reversal->qty_change, $reversal->value_change, $reversal->project_id, $reversal->reverses_movement_id]);
        $this->assertBalance('4.000', 4001, '1000.2500');
        $this->assertSame([], array_filter(app(StockLedger::class)->projectNet($project->id), fn ($row) => $row['qty'] !== '0.000'));
        $this->assertTrue($out->fresh()->reversedBy->is($reversal));
    }

    public function test_reversal_guards(): void
    {
        $project = Project::factory()->create();
        $opening = $this->ledger(MovementType::Opening, [['product_id' => $this->cable->id, 'qty' => '10', 'value' => 100000]])->first();
        $bought = $this->buy('10', 100000);
        $out = $this->out($project, '15');
        $reversal = $this->reverse($out);

        $this->assertRejected('Transaksi ini sudah dibatalkan.', fn () => $this->reverse($out));
        $this->assertRejected('Pembatalan tidak bisa dibatalkan lagi.', fn () => $this->reverse($reversal));
        $this->assertRejected('Stok awal dan koreksi stok opname tidak bisa dibatalkan. Perbaiki lewat stock opname.', fn () => $this->reverse($opening));

        $this->out($project, '15');
        $this->assertRejected('Tidak bisa dibatalkan: stok Kabel NYM 2x1.5 sudah terpakai. Sisa stok 5 m.', fn () => $this->reverse($bought));
        $this->assertBalance('5.000', 50000, '10000.0000');
    }

    public function test_reversal_value_guard_when_stock_reaches_zero(): void
    {
        $project = Project::factory()->create();
        $expensive = $this->buy('10', 30000);
        $this->buy('10', 10000);
        $this->out($project, '10');
        $this->assertBalance('10.000', 20000, '2000.0000');

        $reversal = $this->ledger(MovementType::Reversal, [['movement' => $expensive]], null, 'Batal PB-000001')->first();
        $this->assertSame(-20000, $reversal->value_change);
        $this->assertSame('Batal PB-000001 (penyesuaian nilai karena harga rata-rata)', $reversal->notes);
        $this->assertBalance('0.000', 0, '2000.0000');
    }

    public function test_reversal_value_guard_keeps_value_non_negative(): void
    {
        $project = Project::factory()->create();
        $expensive = $this->buy('10', 30000);
        $this->buy('10', 10000);
        $this->out($project, '8');
        $this->assertBalance('12.000', 24000, '2000.0000');

        $reversal = $this->reverse($expensive);
        $this->assertSame(-24000, $reversal->value_change);
        $this->assertSame('(penyesuaian nilai karena harga rata-rata)', $reversal->notes);
        $this->assertBalance('2.000', 0, '0.0000');

        // Without the guard condition the reversal is exact and has no note.
        $cheap = $this->buy('5', 5000);
        $exact = $this->reverse($cheap);
        $this->assertSame([-5000, null], [$exact->value_change, $exact->notes]);
    }

    public function test_movements_are_append_only(): void
    {
        $movement = $this->buy('10', 100000);

        try {
            $movement->update(['value_change' => 1]);
            $this->fail('Update must be blocked.');
        } catch (LogicException $e) {
            $this->assertSame('Stock movements are append-only and cannot be updated.', $e->getMessage());
        }
        try {
            $movement->delete();
            $this->fail('Delete must be blocked.');
        } catch (LogicException $e) {
            $this->assertSame('Stock movements are append-only and cannot be deleted.', $e->getMessage());
        }

        $this->assertSame(100000, StockMovement::find($movement->id)->value_change);
        $this->assertNull($movement->fresh()->updated_at ?? null);
    }
}
