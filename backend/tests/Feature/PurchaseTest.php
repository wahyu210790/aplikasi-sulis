<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Supplier;
use App\Models\User;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function finance_can_create_purchase_draft()
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create();

        $payload = [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2024-01-01',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5, 'unit_cost' => 100],
            ],
        ];

        $response = $this->actingAs($finance, 'sanctum')->postJson('/api/v1/purchases', $payload);
        $response->assertCreated();
        $response->assertJsonPath('status', 'DRAFT');
    }

    /** @test */
    public function warehouse_cannot_create_purchase()
    {
        $warehouse = User::factory()->create(['role' => 'warehouse']);
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create();

        $payload = [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2024-01-01',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5, 'unit_cost' => 100],
            ],
        ];

        $response = $this->actingAs($warehouse, 'sanctum')->postJson('/api/v1/purchases', $payload);
        $response->assertForbidden();
    }

    /** @test */
    public function purchase_calculates_subtotal_and_total_correctly()
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $supplier = Supplier::factory()->create();
        $productA = Product::factory()->create();
        $productB = Product::factory()->create();

        $payload = [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2024-01-01',
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 10, 'unit_cost' => 100000],
                ['product_id' => $productB->id, 'quantity' => 5, 'unit_cost' => 200000],
            ],
        ];

        $response = $this->actingAs($finance, 'sanctum')->postJson('/api/v1/purchases', $payload);
        $response->assertCreated();
        $response->assertJsonPath('total_amount', 2000000); // 1,000,000 + 1,000,000
    }

    /** @test */
    public function confirm_purchase_updates_stock_and_moving_average()
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create();

        // initial stock 10 @ 100000
        InventoryStock::create([
            'product_id' => $product->id,
            'quantity' => 10,
            'average_cost' => 100000,
            'total_value' => 1000000,
        ]);

        $payload = [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2024-01-01',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 10, 'unit_cost' => 200000],
            ],
        ];

        $create = $this->actingAs($finance, 'sanctum')->postJson('/api/v1/purchases', $payload);
        $create->assertCreated();
        $purchaseId = $create->json('id');

        $confirm = $this->actingAs($finance, 'sanctum')->postJson("/api/v1/purchases/{$purchaseId}/confirm");
        $confirm->assertOk();
        $confirm->assertJsonPath('status', 'CONFIRMED');

        $stock = InventoryStock::where('product_id', $product->id)->first();
        $this->assertEquals(20, $stock->quantity);
        $this->assertEquals(150000, $stock->average_cost);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => 'PURCHASE_IN',
            'quantity' => 10,
            'unit_cost' => 200000,
        ]);
    }

    /** @test */
    public function double_confirmation_is_not_allowed()
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create();
        $payload = [
            'supplier_id' => $supplier->id,
            'purchase_date' => '2024-01-01',
            'items' => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_cost' => 100],
            ],
        ];
        $create = $this->actingAs($finance, 'sanctum')->postJson('/api/v1/purchases', $payload);
        $purchaseId = $create->json('id');
        $this->actingAs($finance, 'sanctum')->postJson("/api/v1/purchases/{$purchaseId}/confirm")->assertOk();
        $this->actingAs($finance, 'sanctum')->postJson("/api/v1/purchases/{$purchaseId}/confirm")->assertStatus(422);
    }
}
?>
