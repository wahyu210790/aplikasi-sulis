<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Project;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\StockOpname;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionRemediationP1Test extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $finance;
    private User $warehouse;
    private Supplier $supplier;
    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->finance = User::factory()->create(['role' => 'finance']);
        $this->warehouse = User::factory()->create(['role' => 'warehouse']);

        $this->supplier = Supplier::create([
            'name' => 'Supplier Alpha',
            'code' => 'SUP-ALPHA',
        ]);

        $category = \App\Models\Category::create(['name' => 'Cat', 'code' => 'CAT']);
        $unit = \App\Models\Unit::create(['name' => 'Liter', 'code' => 'LTR']);

        $this->product = Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'Cat Tembok Premium',
            'code' => 'CAT-001',
        ]);
    }

    /** @test */
    public function financial_overview_and_purchase_summary_include_only_confirmed_purchases()
    {
        // Confirmed Purchase: 5,000,000
        $confirmed = Purchase::create([
            'supplier_id' => $this->supplier->id,
            'purchase_number' => 'PUR-CONFIRMED',
            'purchase_date' => now()->toDateString(),
            'status' => 'CONFIRMED',
            'total_amount' => 5000000,
            'created_by' => $this->owner->id,
        ]);
        $confirmed->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_cost' => 500000,
            'subtotal' => 5000000,
        ]);

        // Draft Purchase: 10,000,000
        $draft = Purchase::create([
            'supplier_id' => $this->supplier->id,
            'purchase_number' => 'PUR-DRAFT',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 10000000,
            'created_by' => $this->owner->id,
        ]);

        // Cancelled Purchase: 20,000,000
        $cancelled = Purchase::create([
            'supplier_id' => $this->supplier->id,
            'purchase_number' => 'PUR-CANCELLED',
            'purchase_date' => now()->toDateString(),
            'status' => 'CANCELLED',
            'total_amount' => 20000000,
            'created_by' => $this->owner->id,
        ]);

        // Test Financial Overview
        $overviewRes = $this->actingAs($this->owner)->getJson('/api/v1/reports/financial-overview');
        $overviewRes->assertStatus(200)
            ->assertJsonPath('total_purchase', 5000000);

        // Test Purchase Summary
        $summaryRes = $this->actingAs($this->finance)->getJson('/api/v1/reports/purchase-summary');
        $summaryRes->assertStatus(200)
            ->assertJsonPath('total_amount', 5000000)
            ->assertJsonPath('total_purchases', 1);

        // Test Owner Dashboard
        $ownerDash = $this->actingAs($this->owner)->getJson('/api/v1/dashboard/owner');
        $ownerDash->assertStatus(200)
            ->assertJsonPath('total_purchase_value', 5000000);

        // Test Finance Dashboard
        $financeDash = $this->actingAs($this->finance)->getJson('/api/v1/dashboard/finance');
        $financeDash->assertStatus(200)
            ->assertJsonPath('total_purchase_value', 5000000);
    }

    /** @test */
    public function purchase_confirmation_preserves_decimal_quantities_without_truncation()
    {
        // Create draft purchase with 2.500 quantity
        $purchase = Purchase::create([
            'supplier_id' => $this->supplier->id,
            'purchase_number' => 'PUR-DECIMAL-1',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 250000,
            'created_by' => $this->finance->id,
        ]);
        $purchase->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 2.500,
            'unit_cost' => 100000,
            'subtotal' => 250000,
        ]);

        // Confirm purchase
        $res = $this->actingAs($this->finance)->postJson("/api/v1/purchases/{$purchase->id}/confirm");
        $res->assertStatus(200);

        // Assert Stock is 2.5 (no truncation to 2)
        $stock = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertNotNull($stock);
        $this->assertEquals(2.5, (float) $stock->quantity);
        $this->assertEquals(250000, (float) $stock->total_value);

        // Assert Inventory Movement is 2.5
        $movement = InventoryMovement::where('product_id', $this->product->id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals(2.5, (float) $movement->quantity);
    }

    /** @test */
    public function stock_deduction_and_opname_support_decimal_quantities()
    {
        // Initial stock via Purchase In: 10.500 units
        $purchase = Purchase::create([
            'supplier_id' => $this->supplier->id,
            'purchase_number' => 'PUR-DECIMAL-2',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 1050000,
            'created_by' => $this->finance->id,
        ]);
        $purchase->items()->create([
            'product_id' => $this->product->id,
            'quantity' => 10.500,
            'unit_cost' => 100000,
            'subtotal' => 1050000,
        ]);
        $this->actingAs($this->finance)->postJson("/api/v1/purchases/{$purchase->id}/confirm");

        // Project Usage with decimal quantity 2.250
        $project = Project::create(['name' => 'Project Pro', 'code' => 'PRJ-PRO', 'status' => 'active']);
        $usageRes = $this->actingAs($this->warehouse)->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->product->id,
            'project_id' => $project->id,
            'quantity' => 2.250,
            'transaction_date' => now()->toDateString(),
        ]);
        $usageRes->assertStatus(201);

        $stock = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(8.25, (float) $stock->quantity);

        // Stock Opname with decimal physical quantity 15.750
        $opnameRes = $this->actingAs($this->warehouse)->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'SO-DECIMAL-1',
            'opname_date' => now()->toDateString(),
        ]);
        $opnameId = $opnameRes->json('id');

        $addItemRes = $this->actingAs($this->warehouse)->postJson("/api/v1/stock-opnames/{$opnameId}/items", [
            'product_id' => $this->product->id,
            'physical_quantity' => 15.750,
        ]);
        $addItemRes->assertStatus(201);

        $completeRes = $this->actingAs($this->warehouse)->postJson("/api/v1/stock-opnames/{$opnameId}/complete");
        $completeRes->assertStatus(200);

        $finalStock = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(15.75, (float) $finalStock->quantity);
    }
}
