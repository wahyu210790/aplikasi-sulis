<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\Project;
use App\Models\StockBalance;
use App\Models\StockMovement;
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

/** docs/desain-v2.md B5.5 and H7: Gudang counts, Owner approves (posting) or rejects. No money in opname responses. */
class OpnameFlowTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use RefreshDatabase;

    private User $owner;

    private User $gudang;

    private User $finance;

    private Product $cable;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create(['name' => 'Pak Owner']);
        $this->gudang = User::factory()->gudang()->create(['name' => 'Gudang Satu']);
        $this->finance = User::factory()->finance()->create();
        // Averages: cable 11,500 per mtr, pipe 10,000 per btg.
        $this->cable = Product::factory()->create(['name' => 'Kabel NYM', 'unit_id' => Unit::factory()->create(['symbol' => 'mtr'])->id]);
        $this->pipe = Product::factory()->create(['name' => 'Pipa PVC']);
        DB::transaction(fn () => app(StockLedger::class)->apply([
            ['product_id' => $this->cable->id, 'qty' => '115', 'value' => 1322500],
            ['product_id' => $this->pipe->id, 'qty' => '12.5', 'value' => 125000],
        ], new MovementContext(MovementType::Opening, '2026-10-01', $this->owner->id)));
    }

    private function createOpname(array $counts): int
    {
        Sanctum::actingAs($this->gudang);
        $id = $this->postJson('/api/v1/stock-opnames', ['opname_date' => '2026-10-27', 'notes' => 'Opname akhir bulan'])
            ->assertCreated()->json('data.id');
        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => $this->items($counts)])->assertOk();

        return $id;
    }

    private function items(array $counts): array
    {
        return array_map(fn ($row) => ['product_id' => $row[0]->id, 'counted_qty' => $row[1]], $counts);
    }

    private function balance(Product $product): array
    {
        $balance = StockBalance::where('product_id', $product->id)->first();

        return [$balance->qty, $balance->stock_value];
    }

    public function test_gudang_counts_and_submits_then_owner_posts_corrections_through_the_ledger(): void
    {
        Sanctum::actingAs($this->gudang);
        $created = $this->postJson('/api/v1/stock-opnames', ['opname_date' => '2026-10-27', 'notes' => 'Opname akhir bulan'])
            ->assertCreated()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.status_label', 'Draft')
            ->assertJsonPath('data.created_by.name', 'Gudang Satu');
        $id = $created->json('data.id');
        $this->assertSame('SO-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT), $created->json('data.number'));

        $saved = $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => $this->items([[$this->cable, '112'], [$this->pipe, '13']])])
            ->assertOk()
            ->assertJsonCount(2, 'data.items')
            ->assertJsonPath('data.items.0.product.name', 'Kabel NYM')
            ->assertJsonPath('data.items.0.product.unit_symbol', 'mtr')
            ->assertJsonPath('data.items.0.system_qty', '115.000')
            ->assertJsonPath('data.items.0.counted_qty', '112.000')
            ->assertJsonPath('data.items.0.diff_qty', null);
        $this->assertNoMoneyKeys($saved);

        $this->postJson("/api/v1/stock-opnames/{$id}/submit")
            ->assertOk()
            ->assertJsonPath('data.status', 'menunggu_persetujuan')
            ->assertJsonPath('data.submitted_by.name', 'Gudang Satu');
        $this->assertNoMoneyKeys($this->getJson("/api/v1/stock-opnames/{$id}"));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/stock-opnames'));

        // Nothing moves before the Owner approves.
        $this->assertSame(['115.000', 1322500], $this->balance($this->cable));

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$id}/post")
            ->assertOk()
            ->assertJsonPath('data.status', 'selesai')
            ->assertJsonPath('data.status_label', 'Selesai')
            ->assertJsonPath('data.posted_by.name', 'Pak Owner')
            ->assertJsonPath('data.items.0.diff_qty', '-3.000')
            ->assertJsonPath('data.items.1.diff_qty', '0.500');

        // Cable: 3 out at average 11,500 = 34,500. Pipe: 0.5 in at average 10,000 = 5,000.
        $this->assertSame(['112.000', 1288000], $this->balance($this->cable));
        $this->assertSame(['13.000', 130000], $this->balance($this->pipe));

        $out = StockMovement::where('type', MovementType::OpnameOut)->sole();
        $this->assertSame([$this->cable->id, '-3.000', -34500, '2026-10-27', 'Stok opname SO-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT)],
            [$out->product_id, $out->qty_change, $out->value_change, $out->movement_date->toDateString(), $out->notes]);
        $in = StockMovement::where('type', MovementType::OpnameIn)->sole();
        $this->assertSame([$this->pipe->id, '0.500', 5000], [$in->product_id, $in->qty_change, $in->value_change]);

        // The movement report links back to the opname document.
        $this->getJson('/api/v1/reports/movements?type=opname_out')
            ->assertOk()
            ->assertJsonPath('data.0.document', ['kind' => 'stock_opname', 'id' => $id, 'number' => 'SO-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT)]);

        $this->assertSame(
            [AuditAction::OPNAME_CREATED, AuditAction::OPNAME_UPDATED, AuditAction::OPNAME_SUBMITTED, AuditAction::OPNAME_POSTED],
            AuditLog::where('action', 'like', 'opname.%')->orderBy('id')->pluck('action')->all(),
        );
    }

    public function test_posting_uses_the_stock_at_approval_time_not_the_stock_when_counting(): void
    {
        $id = $this->createOpname([[$this->cable, '112']]);
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")->assertOk();

        // 5 mtr leave the warehouse before the Owner approves: stock is now 110.
        $this->postJson('/api/v1/stock-outs', [
            'project_id' => Project::factory()->create()->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->cable->id, 'qty' => '5']],
        ])->assertCreated();

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$id}/post")
            ->assertOk()
            ->assertJsonPath('data.items.0.system_qty', '110.000')
            ->assertJsonPath('data.items.0.diff_qty', '2.000');

        $this->assertSame('112.000', $this->balance($this->cable)[0]);
        $this->assertSame(1, StockMovement::where('type', MovementType::OpnameIn)->count());
    }

    public function test_open_opnames_show_todays_stock_and_finished_ones_keep_the_saved_stock(): void
    {
        // QA bug #4: counted at 115, then rejected; meanwhile 5 mtr leave the warehouse.
        $id = $this->createOpname([[$this->cable, '112']]);
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")->assertOk();
        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$id}/reject", ['reason' => 'Tolong hitung ulang kabel'])->assertOk();

        Sanctum::actingAs($this->gudang);
        $this->postJson('/api/v1/stock-outs', [
            'project_id' => Project::factory()->create()->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->cable->id, 'qty' => '5']],
        ])->assertCreated();

        // Draft (rejected) and waiting: today's stock 110, not the 115 saved with the items.
        $draft = $this->getJson("/api/v1/stock-opnames/{$id}")
            ->assertOk()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.items.0.system_qty', '110.000')
            ->assertJsonPath('data.items.0.diff_qty', null);
        $this->assertNoMoneyKeys($draft);
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")->assertOk()->assertJsonPath('data.items.0.system_qty', '110.000');

        // After approval the saved values are shown, even when stock changes later.
        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$id}/post")->assertOk()->assertJsonPath('data.items.0.diff_qty', '2.000');
        $this->postJson('/api/v1/stock-outs', [
            'project_id' => Project::factory()->create()->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->cable->id, 'qty' => '2']],
        ])->assertCreated();
        $this->getJson("/api/v1/stock-opnames/{$id}")
            ->assertOk()
            ->assertJsonPath('data.items.0.system_qty', '110.000')
            ->assertJsonPath('data.items.0.counted_qty', '112.000')
            ->assertJsonPath('data.items.0.diff_qty', '2.000');
    }

    public function test_texts_are_indonesian(): void
    {
        $id = $this->createOpname([[$this->cable, '112']]);
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")->assertOk();
        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$id}/post")->assertOk();

        $number = 'SO-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT);
        $this->assertSame("Membuat stok opname {$number} tanggal 27 Okt 2026", AuditLog::where('action', AuditAction::OPNAME_CREATED)->sole()->summary);
        $this->assertStringStartsWith("Menyetujui stok opname {$number}", AuditLog::where('action', AuditAction::OPNAME_POSTED)->sole()->summary);
        $this->assertSame("Stok opname {$number}", StockMovement::where('type', MovementType::OpnameOut)->sole()->notes);
        $this->assertSame(0, AuditLog::where('summary', 'like', '%stock opname%')->count());
    }

    public function test_an_opname_without_differences_posts_without_movements(): void
    {
        $id = $this->createOpname([[$this->cable, '115'], [$this->pipe, '12.5']]);
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")->assertOk();

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$id}/post")->assertOk()->assertJsonPath('data.items.1.diff_qty', '0.000');

        $this->assertSame(0, StockMovement::whereIn('type', [MovementType::OpnameIn, MovementType::OpnameOut])->count());
        $this->assertSame(['115.000', 1322500], $this->balance($this->cable));
    }

    public function test_item_rules_and_inactive_products(): void
    {
        $inactive = Product::factory()->create(['is_active' => false]);
        Sanctum::actingAs($this->gudang);
        $id = $this->postJson('/api/v1/stock-opnames', ['opname_date' => '2026-10-27'])->assertCreated()->json('data.id');

        // An inactive product may be counted (B10); an empty count is allowed while counting.
        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => [
            ['product_id' => $inactive->id, 'counted_qty' => '0'],
            ['product_id' => $this->cable->id, 'counted_qty' => null, 'notes' => 'Belum dihitung'],
        ]])->assertOk()->assertJsonPath('data.items.0.product.is_active', false)->assertJsonPath('data.items.1.counted_qty', null);

        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => [
            ['product_id' => $this->cable->id, 'counted_qty' => '-1'],
            ['product_id' => $this->cable->id, 'counted_qty' => '1.2345'],
            ['product_id' => 999999, 'counted_qty' => '1'],
        ]])->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.counted_qty', 'items.1.counted_qty', 'items.0.product_id', 'items.2.product_id']);
        $this->assertSame('Barang tidak ditemukan.', $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => [['product_id' => 999999]]])->json('errors')['items.0.product_id'][0]);

        $tooMany = array_map(fn () => ['product_id' => $this->cable->id], range(1, 51));
        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => $tooMany])->assertStatus(422)->assertJsonValidationErrors('items');
        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => []])->assertStatus(422)->assertJsonValidationErrors('items');
        $this->postJson('/api/v1/stock-opnames', ['opname_date' => '2026-10-28'])->assertStatus(422)->assertJsonValidationErrors('opname_date');
    }

    public function test_submit_needs_items_with_every_count_filled(): void
    {
        Sanctum::actingAs($this->gudang);
        $id = $this->postJson('/api/v1/stock-opnames', ['opname_date' => '2026-10-27'])->json('data.id');
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")
            ->assertStatus(422)->assertJsonPath('message', 'Tambahkan minimal 1 barang sebelum mengajukan opname.');

        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => [['product_id' => $this->cable->id, 'counted_qty' => null]]])->assertOk();
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")
            ->assertStatus(422)->assertJsonPath('message', 'Semua barang harus diisi hasil hitungnya sebelum opname diajukan.');
    }

    public function test_owner_rejects_with_a_reason_and_gudang_can_fix_and_submit_again(): void
    {
        $id = $this->createOpname([[$this->cable, '100']]);
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")->assertOk();
        // Waiting for approval: Gudang can no longer change the counts.
        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => $this->items([[$this->cable, '101']])])
            ->assertStatus(422)->assertJsonPath('message', 'Hanya opname berstatus Draft yang bisa diubah.');

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$id}/reject", ['reason' => 'abc'])->assertStatus(422)->assertJsonValidationErrors('reason');
        $this->postJson("/api/v1/stock-opnames/{$id}/reject", ['reason' => 'Tolong hitung ulang kabel'])
            ->assertOk()
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.reject_reason', 'Tolong hitung ulang kabel')
            ->assertJsonPath('data.rejected_by.name', 'Pak Owner')
            ->assertJsonPath('data.submitted_by', null);

        Sanctum::actingAs($this->gudang);
        $this->putJson("/api/v1/stock-opnames/{$id}/items", ['items' => $this->items([[$this->cable, '114']])])->assertOk();
        $this->postJson("/api/v1/stock-opnames/{$id}/submit")
            ->assertOk()->assertJsonPath('data.status', 'menunggu_persetujuan')->assertJsonPath('data.reject_reason', null);

        $this->assertSame(1, AuditLog::where('action', AuditAction::OPNAME_REJECTED)->count());
        $this->assertSame(0, StockMovement::where('type', MovementType::OpnameOut)->count());
    }

    public function test_cancel_and_status_guards(): void
    {
        $draft = $this->createOpname([[$this->cable, '100']]);
        $waiting = $this->createOpname([[$this->cable, '100']]);
        $this->postJson("/api/v1/stock-opnames/{$waiting}/submit")->assertOk();

        // Only a waiting opname can be approved or rejected.
        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$draft}/post")
            ->assertStatus(422)->assertJsonPath('message', 'Hanya opname yang menunggu persetujuan yang bisa disetujui.');
        $this->postJson("/api/v1/stock-opnames/{$draft}/reject", ['reason' => 'Hitung ulang'])->assertStatus(422);

        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/stock-opnames/{$draft}/cancel")->assertOk()->assertJsonPath('data.status', 'batal')->assertJsonPath('data.cancelled_by.name', 'Gudang Satu');
        $this->postJson("/api/v1/stock-opnames/{$waiting}/cancel")->assertOk()->assertJsonPath('data.status_label', 'Batal');
        $this->postJson("/api/v1/stock-opnames/{$draft}/cancel")
            ->assertStatus(422)->assertJsonPath('message', 'Opname yang sudah selesai atau dibatalkan tidak bisa dibatalkan.');
        $this->putJson("/api/v1/stock-opnames/{$draft}/items", ['items' => $this->items([[$this->cable, '1']])])->assertStatus(422);

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$waiting}/post")->assertStatus(422);

        $done = $this->createOpname([[$this->cable, '110']]);
        $this->postJson("/api/v1/stock-opnames/{$done}/submit")->assertOk();
        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/stock-opnames/{$done}/post")->assertOk();
        $this->postJson("/api/v1/stock-opnames/{$done}/post")->assertStatus(422);
        $this->postJson("/api/v1/stock-opnames/{$done}/cancel")->assertStatus(422);

        $this->assertSame('110.000', $this->balance($this->cable)[0]);
        $this->assertSame(2, AuditLog::where('action', AuditAction::OPNAME_CANCELLED)->count());
    }

    public function test_list_filters_and_finance_can_only_view(): void
    {
        $first = $this->createOpname([[$this->cable, '115']]);
        $second = $this->createOpname([[$this->cable, '115'], [$this->pipe, '12.5']]);
        $this->postJson("/api/v1/stock-opnames/{$second}/submit")->assertOk();

        Sanctum::actingAs($this->finance);
        $this->getJson('/api/v1/stock-opnames')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.id', $second)
            ->assertJsonPath('data.0.items_count', 2);
        $this->getJson('/api/v1/stock-opnames?status=draft')->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $first);
        $number = 'SO-'.str_pad((string) $second, 6, '0', STR_PAD_LEFT);
        $this->getJson('/api/v1/stock-opnames?search='.$number)->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/v1/stock-opnames?date_from=2026-10-28')->assertOk()->assertJsonPath('meta.total', 0);
        $this->getJson('/api/v1/stock-opnames?status=salah')->assertStatus(422)->assertJsonValidationErrors('status');
        $this->getJson("/api/v1/stock-opnames/{$first}")->assertOk()->assertJsonPath('data.items.0.system_qty', '115.000');
        $this->postJson('/api/v1/stock-opnames', ['opname_date' => '2026-10-27'])->assertForbidden();
    }
}
