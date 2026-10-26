<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** docs/desain-v2.md B9.2: GET /reports/stock-value, GET /reports/cost-history, GET /products/{id}/cost-history (Owner/Finance, B6). */
class StockReportsTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $gudang;

    private Product $cable;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create();
        $this->gudang = User::factory()->gudang()->create();
        $this->cable = Product::factory()->create(['sku' => 'KBL-1', 'name' => 'Kabel NYM', 'unit_id' => Unit::factory()->create(['symbol' => 'm'])->id]);
        $this->pipe = Product::factory()->create(['sku' => 'PPA-1', 'name' => 'Pipa PVC']);
    }

    private function opening(Product $product, string $qty, int $unitCost): void
    {
        Sanctum::actingAs($this->owner);
        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-01',
            'items' => [['product_id' => $product->id, 'qty' => $qty, 'unit_cost' => $unitCost]],
        ])->assertCreated();
    }

    private function buy(Product $product, string $qty, int $price, string $supplier = 'Toko Sinar Jaya'): Purchase
    {
        $purchase = Purchase::factory()->withItem($product, $qty, $price)->create([
            'supplier_id' => Supplier::factory()->create(['name' => $supplier])->id,
        ]);
        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$purchase->id}/receive")->assertOk();

        return $purchase->fresh();
    }

    public function test_stock_value_per_product_and_total(): void
    {
        $this->opening($this->cable, '100', 10000);
        $this->buy($this->cable, '100', 13000);          // cable: 200 m, 2.300.000, avg 11.500
        $this->opening($this->pipe, '3', 25000);         // pipe: 3, 75.000
        Product::factory()->create(['name' => 'Saklar']); // no stock, no cost yet
        $old = Product::factory()->create(['name' => 'Lampu Lama']);
        $this->opening($old, '2', 5000);
        $old->update(['is_active' => false]);            // inactive but still worth 10.000

        Sanctum::actingAs($this->owner);
        $this->getJson('/api/v1/reports/stock-value')
            ->assertOk()
            ->assertJsonCount(4, 'data')
            ->assertJsonPath('data.0.product.name', 'Kabel NYM')
            ->assertJsonPath('data.0.product.unit_symbol', 'm')
            ->assertJsonPath('data.0.qty', '200.000')
            ->assertJsonPath('data.0.avg_cost', '11500.0000')
            ->assertJsonPath('data.0.stock_value', 2300000)
            ->assertJsonPath('data.0.has_cost', true)
            ->assertJsonPath('data.1.product.name', 'Lampu Lama')
            ->assertJsonPath('data.1.product.is_active', false)
            ->assertJsonPath('data.3.product.name', 'Saklar')
            ->assertJsonPath('data.3.stock_value', 0)
            ->assertJsonPath('data.3.has_cost', false)
            ->assertJsonPath('meta.total', 4)
            ->assertJsonPath('totals.stock_value', 2385000);

        // The total covers every product that matches the filters, not only the current page.
        $this->getJson('/api/v1/reports/stock-value?per_page=1')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('totals.stock_value', 2385000);
        $this->getJson('/api/v1/reports/stock-value?search=pipa')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('totals.stock_value', 75000);
        $this->getJson('/api/v1/reports/stock-value?is_active=1')
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('totals.stock_value', 2375000);
    }

    public function test_cost_history_shows_purchase_prices_and_average_after_each(): void
    {
        $this->opening($this->cable, '100', 10000);
        $first = $this->buy($this->cable, '100', 13000, 'CV Maju');
        Sanctum::actingAs($this->gudang);
        $this->postJson('/api/v1/stock-outs', [
            'project_id' => Project::factory()->create()->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->cable->id, 'qty' => '50']],
        ])->assertCreated();
        $this->opening($this->pipe, '3', 25000);

        Sanctum::actingAs($this->owner);
        $this->getJson("/api/v1/products/{$this->cable->id}/cost-history")
            ->assertOk()
            ->assertJsonCount(2, 'data') // the stock-out is not a price
            ->assertJsonPath('data.0.type', 'purchase_in')
            ->assertJsonPath('data.0.type_label', 'Pembelian Masuk')
            ->assertJsonPath('data.0.qty', '100.000')
            ->assertJsonPath('data.0.unit_cost', '13000.0000')
            ->assertJsonPath('data.0.avg_cost_after', '11500.0000')
            ->assertJsonPath('data.0.purchase', ['id' => $first->id, 'number' => $first->number])
            ->assertJsonPath('data.0.supplier.name', 'CV Maju')
            ->assertJsonPath('data.0.reversed', false)
            ->assertJsonPath('data.1.type', 'opening')
            ->assertJsonPath('data.1.movement_date', '2026-10-01')
            ->assertJsonPath('data.1.unit_cost', '10000.0000')
            ->assertJsonPath('data.1.avg_cost_after', '10000.0000')
            ->assertJsonPath('data.1.purchase', null)
            ->assertJsonPath('data.1.supplier', null);

        $this->getJson('/api/v1/reports/cost-history')->assertOk()->assertJsonCount(3, 'data')->assertJsonPath('data.0.product.name', 'Pipa PVC');
        $this->getJson("/api/v1/reports/cost-history?product_id={$this->pipe->id}")->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/reports/cost-history?date_from=2026-10-02')->assertJsonCount(1, 'data')->assertJsonPath('data.0.supplier.name', 'CV Maju');
        $this->getJson('/api/v1/reports/cost-history?date_from=2026-10-10&date_to=2026-10-01')->assertUnprocessable()->assertJsonValidationErrors(['date_to']);
    }

    public function test_a_cancelled_purchase_stays_in_the_history_marked_reversed(): void
    {
        $this->opening($this->cable, '10', 10000);
        $purchase = $this->buy($this->cable, '20', 14000);
        Sanctum::actingAs($this->owner);
        $this->postJson("/api/v1/purchases/{$purchase->id}/cancel", ['reason' => 'Salah supplier'])->assertOk();

        $this->getJson("/api/v1/products/{$this->cable->id}/cost-history")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.reversed', true)
            ->assertJsonPath('data.0.unit_cost', '14000.0000')
            ->assertJsonPath('data.1.reversed', false);
    }

    public function test_gudang_gets_403_on_money_reports(): void
    {
        Sanctum::actingAs($this->gudang);

        $this->getJson('/api/v1/reports/stock-value')->assertForbidden();
        $this->getJson('/api/v1/reports/cost-history')->assertForbidden();
        $this->getJson("/api/v1/products/{$this->cable->id}/cost-history")->assertForbidden();
    }
}
