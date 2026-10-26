<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Enums\PurchaseStatus;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Services\MovementContext;
use App\Services\StockLedger;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** docs/desain-v2.md B5.1 step 4 (PurchaseFlowTest part 2): Owner cancels a RECEIVED purchase = reversal (B4.4). */
class PurchaseCancelTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Product $cable;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create();
        $meter = Unit::factory()->create(['symbol' => 'mtr']);
        $this->cable = Product::factory()->create(['name' => 'Kabel NYM', 'unit_id' => $meter->id]);
        $this->pipe = Product::factory()->create(['name' => 'Pipa PVC']);
    }

    /** Creates and receives a purchase through the API. Returns its id. */
    private function receivedPurchase(array $items): int
    {
        Sanctum::actingAs(User::factory()->finance()->create());
        $id = $this->postJson('/api/v1/purchases', [
            'supplier_id' => Supplier::factory()->create()->id,
            'purchase_date' => '2026-10-20',
            'items' => $items,
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs(User::factory()->gudang()->create());
        $this->postJson("/api/v1/purchases/{$id}/receive")->assertOk();

        return $id;
    }

    private function takeOut(Product $product, string $qty): void
    {
        $project = Project::factory()->create();
        DB::transaction(fn () => app(StockLedger::class)->apply(
            [['product_id' => $product->id, 'qty' => $qty]],
            new MovementContext(MovementType::ProjectOut, '2026-10-27', $this->owner->id, projectId: $project->id),
        ));
    }

    private function balance(Product $product): array
    {
        $balance = StockBalance::where('product_id', $product->id)->first();

        return [$balance->qty, $balance->stock_value, $balance->avg_cost];
    }

    public function test_owner_cancels_a_received_purchase_and_stock_goes_back(): void
    {
        Sanctum::actingAs($this->owner);
        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-01',
            'items' => [['product_id' => $this->cable->id, 'qty' => '10', 'unit_cost' => 10000]],
        ])->assertCreated();
        $id = $this->receivedPurchase([
            ['product_id' => $this->cable->id, 'qty' => '10', 'unit_price' => 12000],
            ['product_id' => $this->pipe->id, 'qty' => '2.5', 'unit_price' => 1001],
        ]);
        $this->pipe->update(['is_active' => false]); // reversal is still allowed for inactive products

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'Salah supplier'])
            ->assertOk()
            ->assertJsonPath('data.status', 'batal')
            ->assertJsonPath('data.cancelled_by.id', $this->owner->id)
            ->assertJsonPath('data.received_by.name', fn ($name) => $name !== null);

        $this->assertSame(['10.000', 100000, '10000.0000'], $this->balance($this->cable));
        $this->assertSame(['0.000', 0, '1001.2000'], $this->balance($this->pipe));

        $reversals = StockMovement::where('type', MovementType::Reversal)->orderBy('product_id')->get();
        $originals = StockMovement::where('type', MovementType::PurchaseIn)->orderBy('product_id')->get();
        $this->assertCount(2, $reversals);
        $this->assertSame($originals->pluck('id')->all(), $reversals->pluck('reverses_movement_id')->all());
        $this->assertSame(['-10.000', -120000, '2026-10-27', 'Pembatalan pembelian PB-000001: Salah supplier'], [
            $reversals[0]->qty_change, $reversals[0]->value_change, $reversals[0]->movement_date->toDateString(), $reversals[0]->notes,
        ]);
        $this->assertSame('Membatalkan pembelian PB-000001 (Diterima): Salah supplier', AuditLog::where('action', AuditAction::PURCHASE_CANCELLED)->sole()->summary);

        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'Salah supplier'])
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Pembelian ini sudah dibatalkan.']);
        $this->assertSame(2, StockMovement::where('type', MovementType::Reversal)->count());
    }

    public function test_only_owner_may_cancel_a_received_purchase(): void
    {
        $id = $this->receivedPurchase([['product_id' => $this->cable->id, 'qty' => '5', 'unit_price' => 1000]]);

        Sanctum::actingAs(User::factory()->finance()->create());
        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'Salah input'])
            ->assertForbidden()
            ->assertExactJson(['message' => 'Anda tidak memiliki akses untuk tindakan ini.']);

        Sanctum::actingAs(User::factory()->gudang()->create());
        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'Salah input'])->assertForbidden();

        $this->assertSame(PurchaseStatus::Diterima, Purchase::find($id)->status);
        $this->assertSame(0, StockMovement::where('type', MovementType::Reversal)->count());
        $this->assertSame(0, AuditLog::where('action', AuditAction::PURCHASE_CANCELLED)->count());
    }

    public function test_cancel_is_blocked_when_the_stock_was_already_used(): void
    {
        $id = $this->receivedPurchase([
            ['product_id' => $this->cable->id, 'qty' => '10', 'unit_price' => 12000],
            ['product_id' => $this->pipe->id, 'qty' => '4', 'unit_price' => 5000],
        ]);
        $this->takeOut($this->cable, '5');

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/purchases/{$id}/cancel", ['reason' => 'Barang rusak'])
            ->assertStatus(422)
            ->assertExactJson(['message' => 'Tidak bisa dibatalkan: stok Kabel NYM sudah terpakai. Sisa stok 5 mtr.']);

        // Nothing changed: no reversal for the pipe either, status still diterima.
        $this->assertSame(0, StockMovement::where('type', MovementType::Reversal)->count());
        $this->assertSame(['4.000', 20000, '5000.0000'], $this->balance($this->pipe));
        $this->assertSame(PurchaseStatus::Diterima, Purchase::find($id)->status);
    }

    public function test_value_guard_takes_the_remaining_value_when_stock_returns_to_zero(): void
    {
        $this->receivedPurchase([['product_id' => $this->cable->id, 'qty' => '10', 'unit_price' => 10000]]);
        $second = $this->receivedPurchase([['product_id' => $this->cable->id, 'qty' => '10', 'unit_price' => 14000]]);
        $this->assertSame(['20.000', 240000, '12000.0000'], $this->balance($this->cable));
        $this->takeOut($this->cable, '10'); // takes 120000 at average cost
        $this->assertSame(['10.000', 120000, '12000.0000'], $this->balance($this->cable));

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/purchases/{$second}/cancel", ['reason' => 'Retur ke supplier'])->assertOk();

        $reversal = StockMovement::where('type', MovementType::Reversal)->sole();
        $this->assertSame(['-10.000', -120000, 'Pembatalan pembelian PB-000002: Retur ke supplier (penyesuaian nilai karena harga rata-rata)'], [
            $reversal->qty_change, $reversal->value_change, $reversal->notes,
        ]);
        $this->assertSame(['0.000', 0, '12000.0000'], $this->balance($this->cable));
    }
}
