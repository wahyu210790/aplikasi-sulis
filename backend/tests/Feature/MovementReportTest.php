<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Project;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** GET /products/{product}/movements and GET /reports/movements: filters, documents, money for Owner/Finance. */
class MovementReportTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $gudang;

    private Product $cable;

    private Product $pipe;

    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create();
        $this->gudang = User::factory()->gudang()->create();
        $this->cable = Product::factory()->create();
        $this->pipe = Product::factory()->create();
        $this->project = Project::factory()->create();

        Sanctum::actingAs($this->owner);
        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-01',
            'items' => [['product_id' => $this->cable->id, 'qty' => '10', 'unit_cost' => 10000]],
        ])->assertCreated();
        $purchaseId = $this->postJson('/api/v1/purchases', [
            'supplier_id' => Supplier::factory()->create()->id,
            'purchase_date' => '2026-10-10',
            'items' => [['product_id' => $this->pipe->id, 'qty' => '5', 'unit_price' => 2000]],
        ])->json('data.id');

        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$purchaseId}/receive")->assertOk();
        $this->postJson('/api/v1/stock-outs', [
            'project_id' => $this->project->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-20',
            'items' => [['product_id' => $this->cable->id, 'qty' => '4']],
        ])->assertCreated();

        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/purchases/{$purchaseId}/cancel", ['reason' => 'Barang salah kirim'])->assertOk();
    }

    public function test_gudang_gets_no_link_to_a_cancelled_purchase(): void
    {
        $ownerRows = $this->getJson('/api/v1/reports/movements')->json('data');
        $this->assertIsInt($ownerRows[0]['document']['id']);

        Sanctum::actingAs($this->gudang);
        $rows = $this->getJson('/api/v1/reports/movements')->assertOk()->json('data');
        $this->assertSame(['purchase', null, 'PB-000001'], [$rows[0]['document']['kind'], $rows[0]['document']['id'], $rows[0]['document']['number']]);
        $this->assertSame(['purchase', null], [$rows[2]['document']['kind'], $rows[2]['document']['id']]);
        $this->assertIsInt($rows[1]['document']['id'], 'other documents keep their link');
        $this->getJson("/api/v1/purchases/{$ownerRows[0]['document']['id']}")->assertNotFound();
    }

    public function test_report_lists_every_movement_newest_first_with_its_document(): void
    {
        $rows = $this->getJson('/api/v1/reports/movements')->assertOk()->assertJsonPath('meta.total', 4)->json('data');

        $this->assertSame(['reversal', 'project_out', 'purchase_in', 'opening'], array_column($rows, 'type'));
        $this->assertSame(['purchase', 'PB-000001'], [$rows[0]['document']['kind'], $rows[0]['document']['number']]);
        $this->assertSame($rows[2]['id'], $rows[0]['reverses_movement_id']);
        $this->assertSame('stock_transaction', $rows[1]['document']['kind']);
        $this->assertNull($rows[3]['document']);
        $this->assertNull($rows[3]['person_name']);
        $this->assertSame([-40000, '10000.0000', 60000, '10000.0000'], [
            $rows[1]['value_change'], $rows[1]['unit_cost'], $rows[1]['value_after'], $rows[1]['avg_cost_after'],
        ]);
    }

    public function test_report_filters(): void
    {
        $types = fn (string $query) => array_column($this->getJson('/api/v1/reports/movements?'.$query)->assertOk()->json('data'), 'type');

        $this->assertSame(['project_out', 'opening'], $types("product_id={$this->cable->id}"));
        $this->assertSame(['project_out'], $types("project_id={$this->project->id}"));
        $this->assertSame(['project_out', 'purchase_in'], $types("user_id={$this->gudang->id}"));
        $this->assertSame(['purchase_in'], $types('type=purchase_in'));
        $this->assertSame(['purchase_in', 'opening'], $types('date_from=2026-10-01&date_to=2026-10-15'));
        $this->assertSame(['reversal'], $types('date_from=2026-10-27'));
        $this->getJson('/api/v1/reports/movements?type=hapus')->assertStatus(422);
        $this->getJson('/api/v1/reports/movements?date_from=2026-10-27&date_to=2026-10-01')->assertStatus(422);
    }

    public function test_product_ledger_shows_only_that_product(): void
    {
        $this->getJson("/api/v1/products/{$this->pipe->id}/movements")
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.type_label', 'Pembatalan')
            ->assertJsonPath('data.0.qty_after', '0.000')
            ->assertJsonPath('data.1.type_label', 'Pembelian Masuk')
            ->assertJsonPath('data.1.qty_change', '5.000');

        $this->getJson("/api/v1/products/{$this->cable->id}/movements?type=opening")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/products/{$this->cable->id}/movements?per_page=1")->assertOk()->assertJsonPath('meta.last_page', 2);
        $this->getJson('/api/v1/products/999/movements')->assertNotFound();
    }
}
