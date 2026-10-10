<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class StockOpnameTest extends TestCase
{
    use RefreshDatabase;

    protected $owner;
    protected $warehouse;
    protected $finance;
    protected $product;

    protected function setUp(): void
    {
        parent::setUp();
        // seed base data (categories, units, etc.) via existing seeders
        $this->artisan('db:seed');
        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->warehouse = User::factory()->create(['role' => 'warehouse']);
        $this->finance = User::factory()->create(['role' => 'finance']);
        $this->product = Product::factory()->create();
        // give some initial stock via inventory service
        // use existing service to create purchase-in
        \App\Services\InventoryService::recordPurchaseIn(
            $this->product->id,
            100,
            5000, // unit cost
            now()->toDateString(),
            $this->owner->id
        );
    }

    public function test_warehouse_can_create_stock_opname()
    {
        Sanctum::actingAs($this->warehouse);
        $response = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-001',
            'opname_date' => now()->toDateString(),
            'notes' => 'first opname',
        ]);
        $response->assertStatus(201);
        $this->assertDatabaseHas('stock_opnames', ['opname_number' => 'OP-001', 'status' => 'DRAFT']);
    }

    public function test_finance_cannot_create_stock_opname()
    {
        Sanctum::actingAs($this->finance);
        $response = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-002',
            'opname_date' => now()->toDateString(),
        ]);
        $response->assertStatus(403);
    }

    public function test_add_item_snapshots_system_quantity()
    {
        Sanctum::actingAs($this->warehouse);
        // create opname
        $op = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-003',
            'opname_date' => now()->toDateString(),
        ])->assertStatus(201)->json();
        // add item with physical quantity 120 (system 100)
        $itemResp = $this->postJson("/api/v1/stock-opnames/{$op['id']}/items", [
            'product_id' => $this->product->id,
            'physical_quantity' => 120,
        ])->assertStatus(201)->json();
        $this->assertEquals(100, $itemResp['system_quantity']);
        $this->assertEquals(20, $itemResp['difference_quantity']);
    }

    public function test_complete_positive_adjustment_creates_adjustment_in()
    {
        Sanctum::actingAs($this->warehouse);
        $op = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-004',
            'opname_date' => now()->toDateString(),
        ])->assertStatus(201)->json();
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/items", [
            'product_id' => $this->product->id,
            'physical_quantity' => 150,
        ])->assertStatus(201);
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/complete")->assertStatus(200);
        $this->assertDatabaseHas('stock_opnames', ['id' => $op['id'], 'status' => 'COMPLETED']);
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $this->product->id,
            'type' => 'ADJUSTMENT_IN',
            'quantity' => 50,
        ]);
        $stock = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(150, $stock->quantity);
    }

    public function test_complete_negative_adjustment_creates_adjustment_out_and_decreases_stock()
    {
        Sanctum::actingAs($this->warehouse);
        $op = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-005',
            'opname_date' => now()->toDateString(),
        ])->assertStatus(201)->json();
        // physical 80, system 100 => diff -20
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/items", [
            'product_id' => $this->product->id,
            'physical_quantity' => 80,
        ])->assertStatus(201);
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/complete")->assertStatus(200);
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $this->product->id,
            'type' => 'ADJUSTMENT_OUT',
            'quantity' => 20,
        ]);
        $stock = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(80, $stock->quantity);
    }

    public function test_complete_zero_difference_creates_no_movement()
    {
        Sanctum::actingAs($this->warehouse);
        $op = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-006',
            'opname_date' => now()->toDateString(),
        ])->assertStatus(201)->json();
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/items", [
            'product_id' => $this->product->id,
            'physical_quantity' => 100,
        ])->assertStatus(201);
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/complete")->assertStatus(200);
        $this->assertDatabaseMissing('inventory_movements', [
            'product_id' => $this->product->id,
            'type' => 'ADJUSTMENT_IN',
        ]);
        $this->assertDatabaseMissing('inventory_movements', [
            'product_id' => $this->product->id,
            'type' => 'ADJUSTMENT_OUT',
        ]);
        $stock = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(100, $stock->quantity);
    }

    public function test_cannot_edit_after_completion()
    {
        Sanctum::actingAs($this->warehouse);
        $op = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-007',
            'opname_date' => now()->toDateString(),
        ])->assertStatus(201)->json();
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/items", [
            'product_id' => $this->product->id,
            'physical_quantity' => 110,
        ])->assertStatus(201);
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/complete")->assertStatus(200);
        // attempt to update opname date
        $this->putJson("/api/v1/stock-opnames/{$op['id']}", ['opname_date' => now()->addDay()->toDateString()])
            ->assertStatus(422);
    }

    public function test_insufficient_stock_for_negative_adjustment_rolls_back()
    {
        Sanctum::actingAs($this->warehouse);
        $op = $this->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'OP-008',
            'opname_date' => now()->toDateString(),
        ])->assertStatus(201)->json();
        // two items, one will cause insufficient stock
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/items", [
            'product_id' => $this->product->id,
            'physical_quantity' => 10,
        ])->assertStatus(201); // diff -90
        // create another product with low stock
        $lowProd = Product::factory()->create();
        \App\Services\InventoryService::recordPurchaseIn($lowProd->id, 5, 2000, now()->toDateString(), $this->owner->id);
        $this->postJson("/api/v1/stock-opnames/{$op['id']}/items", [
            'product_id' => $lowProd->id,
            'physical_quantity' => 0,
        ])->assertStatus(201); // diff -5, insufficient when applied after first
        InventoryStock::where('product_id', $lowProd->id)->decrement('quantity', 2);
        $resp = $this->postJson("/api/v1/stock-opnames/{$op['id']}/complete");
        $resp->assertStatus(422);
        $this->assertDatabaseHas('stock_opnames', ['id' => $op['id'], 'status' => 'DRAFT']);
        $this->assertDatabaseMissing('inventory_movements', ['reference_id' => $op['id']]);
    }
}
?>
