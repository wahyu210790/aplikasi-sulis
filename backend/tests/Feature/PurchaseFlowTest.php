<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Enums\PurchaseStatus;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\AssertsNoMoneyKeys;
use Tests\TestCase;

/** docs/desain-v2.md B5.1 steps 1-3 and the Gudang view rules (B6, B7). Cancelling a received purchase: PurchaseCancelTest. */
class PurchaseFlowTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use RefreshDatabase;

    private User $finance;

    private User $gudang;

    private Supplier $supplier;

    private Product $cable;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->finance = User::factory()->finance()->create();
        $this->gudang = User::factory()->gudang()->create(['name' => 'Andi']);
        $this->supplier = Supplier::factory()->create(['name' => 'Toko Sinar']);
        $this->cable = Product::factory()->create(['name' => 'Kabel NYM']);
        $this->pipe = Product::factory()->create(['name' => 'Pipa PVC']);
    }

    private function draft(array $overrides = []): array
    {
        return [
            'supplier_id' => $this->supplier->id,
            'purchase_date' => '2026-10-20',
            'invoice_no' => ' INV-77 ',
            'notes' => 'Untuk stok bulan ini',
            'items' => [
                ['product_id' => $this->cable->id, 'qty' => '10', 'unit_price' => 12000],
                ['product_id' => $this->pipe->id, 'qty' => '2.5', 'unit_price' => 1001],
            ],
            ...$overrides,
        ];
    }

    private function createDraft(array $overrides = []): int
    {
        Sanctum::actingAs($this->finance);

        return $this->postJson('/api/v1/purchases', $this->draft($overrides))->assertCreated()->json('data.id');
    }

    public function test_finance_creates_a_draft_with_server_computed_totals(): void
    {
        Sanctum::actingAs($this->finance);

        $this->postJson('/api/v1/purchases', [...$this->draft(), 'total_value' => 1])
            ->assertCreated()
            ->assertJsonPath('data.number', 'PB-000001')
            ->assertJsonPath('data.status', 'draft')
            ->assertJsonPath('data.status_label', 'Draft')
            ->assertJsonPath('data.supplier', ['id' => $this->supplier->id, 'name' => 'Toko Sinar'])
            ->assertJsonPath('data.invoice_no', 'INV-77')
            ->assertJsonPath('data.items.0.qty', '10.000')
            ->assertJsonPath('data.items.0.line_total', 120000)
            ->assertJsonPath('data.items.1.qty', '2.500')
            ->assertJsonPath('data.items.1.unit_price', 1001)
            ->assertJsonPath('data.items.1.line_total', 2503)
            ->assertJsonPath('data.total_value', 122503)
            ->assertJsonPath('data.received_by', null);

        $this->assertSame(0, StockMovement::count());
        $this->assertSame('0.000', $this->cable->stockBalance->fresh()->qty);
        $this->assertSame('Membuat pembelian PB-000001 dari Toko Sinar (2 barang)', AuditLog::where('action', AuditAction::PURCHASE_CREATED)->sole()->summary);
    }

    public function test_draft_validation_messages_are_indonesian(): void
    {
        Sanctum::actingAs($this->finance);
        $inactive = Supplier::factory()->inactive()->create();

        $errors = $this->postJson('/api/v1/purchases', $this->draft([
            'supplier_id' => $inactive->id,
            'purchase_date' => '2026-10-28',
            'items' => [
                ['product_id' => $this->cable->id, 'qty' => '1,5', 'unit_price' => -5],
                ['product_id' => $this->cable->id, 'qty' => '1'],
            ],
        ]))->assertStatus(422)->json('errors');

        $this->assertEquals([
            'supplier_id' => ['Pemasok tidak ditemukan atau sudah nonaktif.'],
            'purchase_date' => ['Tanggal pembelian tidak boleh melewati hari ini.'],
            'items.0.product_id' => ['Barang yang sama tidak boleh dipilih dua kali.'],
            'items.1.product_id' => ['Barang yang sama tidak boleh dipilih dua kali.'],
            'items.0.qty' => ['Jumlah harus berupa angka, maksimal 3 angka di belakang koma.'],
            'items.0.unit_price' => ['Harga satuan minimal 0.'],
            'items.1.unit_price' => ['Harga satuan wajib diisi.'],
        ], $errors);
        $this->assertSame(0, Purchase::count());
    }

    public function test_finance_updates_then_deletes_a_draft(): void
    {
        $id = $this->createDraft();

        $this->putJson("/api/v1/purchases/{$id}", $this->draft([
            'invoice_no' => '',
            'items' => [['product_id' => $this->pipe->id, 'qty' => '4', 'unit_price' => 30000]],
        ]))->assertOk()
            ->assertJsonPath('data.invoice_no', null)
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.product.id', $this->pipe->id)
            ->assertJsonPath('data.total_value', 120000);

        $log = AuditLog::where('action', AuditAction::PURCHASE_UPDATED)->sole();
        $this->assertSame(122503, $log->changes['before']['total_value']);
        $this->assertSame(120000, $log->changes['after']['total_value']);

        $this->deleteJson("/api/v1/purchases/{$id}")->assertNoContent();
        $this->assertSame(0, Purchase::count());
        $this->assertDatabaseCount('purchase_items', 0);
        $this->assertSame('Menghapus draft pembelian PB-000001', AuditLog::where('action', AuditAction::PURCHASE_DELETED)->sole()->summary);
    }

    public function test_gudang_receives_and_stock_goes_in_at_purchase_price(): void
    {
        Sanctum::actingAs(User::factory()->owner()->create());
        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-01',
            'items' => [['product_id' => $this->cable->id, 'qty' => '10', 'unit_cost' => 10000]],
        ])->assertCreated();
        $id = $this->createDraft();

        Sanctum::actingAs($this->gudang);
        $response = $this->postJson("/api/v1/purchases/{$id}/receive")
            ->assertOk()
            ->assertJsonPath('data.status', 'diterima')
            ->assertJsonPath('data.status_label', 'Diterima')
            ->assertJsonPath('data.received_by', ['id' => $this->gudang->id, 'name' => 'Andi']);
        $this->assertNoMoneyKeys($response);

        $cable = StockBalance::where('product_id', $this->cable->id)->first();
        $this->assertSame(['20.000', 220000, '11000.0000'], [$cable->qty, $cable->stock_value, $cable->avg_cost]);
        $pipe = StockBalance::where('product_id', $this->pipe->id)->first();
        $this->assertSame(['2.500', 2503, '1001.2000', true], [$pipe->qty, $pipe->stock_value, $pipe->avg_cost, $pipe->has_cost]);

        $movement = StockMovement::where('type', MovementType::PurchaseIn)->where('product_id', $this->cable->id)->sole();
        $purchase = Purchase::with('items')->find($id);
        $this->assertSame($purchase->items[0]->id, $movement->purchase_item_id);
        $this->assertSame(['2026-10-20', 120000, 'Pembelian PB-000001', $this->gudang->id], [$movement->movement_date->toDateString(), $movement->value_change, $movement->notes, $movement->created_by]);
        $this->assertSame('Menerima barang pembelian PB-000001 (2 barang)', AuditLog::where('action', AuditAction::PURCHASE_RECEIVED)->sole()->summary);
    }

    public function test_a_purchase_can_be_received_only_once(): void
    {
        $id = $this->createDraft();
        Sanctum::actingAs($this->gudang);

        $this->postJson("/api/v1/purchases/{$id}/receive")->assertOk();
        $this->postJson("/api/v1/purchases/{$id}/receive")
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Pembelian ini sudah diproses.']);

        $this->assertSame(2, StockMovement::count());
        $this->assertSame('10.000', StockBalance::where('product_id', $this->cable->id)->value('qty'));
    }

    public function test_receive_rolls_back_everything_when_a_product_was_deactivated(): void
    {
        $id = $this->createDraft();
        $this->pipe->update(['is_active' => false]);

        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$id}/receive")
            ->assertStatus(422)
            ->assertExactJson(['message' => "Barang {$this->pipe->sku} (Pipa PVC) sudah nonaktif dan tidak bisa dipakai untuk transaksi baru."]);

        $this->assertSame(0, StockMovement::count());
        $this->assertSame(PurchaseStatus::Draft, Purchase::find($id)->status);
    }

    public function test_an_old_draft_keeps_its_date_when_received_later(): void
    {
        $id = $this->createDraft(['purchase_date' => '2026-10-01']);
        $this->travelTo('2026-11-20 09:00:00');

        $this->putJson("/api/v1/purchases/{$id}", $this->draft(['purchase_date' => '2026-10-01']))
            ->assertStatus(422)
            ->assertJsonPath('errors.purchase_date.0', 'Tanggal pembelian paling lama 30 hari ke belakang (paling awal 21-10-2026).');

        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$id}/receive")->assertOk();
        $this->assertSame(['2026-10-01'], StockMovement::pluck('movement_date')->map->toDateString()->unique()->values()->all());
    }

    public function test_only_drafts_can_be_edited_or_deleted(): void
    {
        $id = $this->createDraft();
        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$id}/receive")->assertOk();

        Sanctum::actingAs($this->finance);
        $this->putJson("/api/v1/purchases/{$id}", $this->draft())
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Hanya pembelian berstatus Draft yang bisa diubah.']);
        $this->deleteJson("/api/v1/purchases/{$id}")
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Hanya pembelian berstatus Draft yang bisa dihapus.']);
        $this->assertSame(122503, Purchase::find($id)->total_value);
    }

    public function test_finance_cancels_a_draft_with_a_reason(): void
    {
        $id = $this->createDraft();

        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'abc'])
            ->assertStatus(422)
            ->assertJsonPath('errors.reason.0', 'Alasan minimal 5 karakter.');

        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'Supplier tidak jadi kirim'])
            ->assertOk()
            ->assertJsonPath('data.status', 'batal')
            ->assertJsonPath('data.cancel_reason', 'Supplier tidak jadi kirim')
            ->assertJsonPath('data.cancelled_by.id', $this->finance->id);
        $this->assertSame('Membatalkan pembelian PB-000001 (Draft): Supplier tidak jadi kirim', AuditLog::where('action', AuditAction::PURCHASE_CANCELLED)->sole()->summary);

        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'Supplier tidak jadi kirim'])
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Pembelian ini sudah dibatalkan.']);

        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$id}/receive")
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Pembelian ini sudah diproses.']);
        $this->assertSame(0, StockMovement::count());
    }

    public function test_gudang_sees_only_draft_and_received_purchases_without_money(): void
    {
        $draft = $this->createDraft();
        $received = $this->createDraft(['invoice_no' => 'INV-88']);
        $cancelled = $this->createDraft(['invoice_no' => 'INV-99']);
        $this->postJson("/api/v1/purchases/{$cancelled}/cancel", ['reason' => 'Salah input'])->assertOk();

        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$received}/receive")->assertOk();

        $list = $this->getJson('/api/v1/purchases')->assertOk();
        $this->assertNoMoneyKeys($list);
        $this->assertSame([$received, $draft], array_column($list->json('data'), 'id'));
        $this->assertSame(2, $list->json('data.0.items_count'));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/purchases/{$draft}"));
        $this->getJson("/api/v1/purchases/{$draft}")->assertJsonPath('data.items.0.product.id', $this->cable->id);
        $this->getJson("/api/v1/purchases/{$cancelled}")->assertNotFound()->assertExactJson(['message' => 'Data tidak ditemukan.']);
        $this->getJson('/api/v1/purchases?status=batal')->assertOk()->assertJsonCount(0, 'data');

        Sanctum::actingAs($this->finance);
        $this->assertSame([$cancelled, $received, $draft], array_column($this->getJson('/api/v1/purchases')->json('data'), 'id'));
        $this->getJson("/api/v1/purchases/{$cancelled}")->assertOk()->assertJsonPath('data.total_value', 122503);
    }

    public function test_list_filters_by_search_status_supplier_and_date(): void
    {
        $first = $this->createDraft(['purchase_date' => '2026-10-01', 'invoice_no' => 'INV-A']);
        $other = Supplier::factory()->create(['name' => 'CV Maju']);
        $second = $this->createDraft(['purchase_date' => '2026-10-15', 'supplier_id' => $other->id]);

        $ids = fn (string $query) => array_column($this->getJson('/api/v1/purchases?'.$query)->assertOk()->json('data'), 'id');

        $this->assertSame([$first], $ids('search=inv-a'));
        $this->assertSame([$second], $ids('search=maju'));
        $this->assertSame([$second], $ids('search=PB-000002'));
        $this->assertSame([$second], $ids("supplier_id={$other->id}"));
        $this->assertSame([$first], $ids('date_from=2026-09-30&date_to=2026-10-14'));
        $this->assertSame([$first, $second], $ids('sort=purchase_date&direction=asc'));
        $this->assertSame([], $ids('status=diterima'));
        $this->getJson('/api/v1/purchases?date_from=2026-10-15&date_to=2026-10-01')->assertStatus(422);
    }
}
