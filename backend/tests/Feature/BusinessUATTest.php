<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\InventoryStock;
use App\Models\InventoryMovement;
use App\Models\StockOpname;
use App\Models\ProjectExpense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BusinessUATTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $finance;
    private User $warehouse;

    private Category $catA;
    private Category $catB;
    private Unit $unitPcs;
    private Unit $unitLiter;
    private Unit $unitKg;
    private Unit $unitMeter;

    private Product $prod1; // Pcs
    private Product $prod2; // Liter
    private Product $prod3; // Kg
    private Product $prod4; // Meter

    private Supplier $supA;
    private Supplier $supB;

    private Project $projAlpha;
    private Project $projBeta;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Users
        $this->owner = User::factory()->create(['name' => 'Owner Sulis', 'email' => 'owner_uat@example.com', 'role' => 'owner']);
        $this->finance = User::factory()->create(['name' => 'Finance Staff', 'email' => 'finance_uat@example.com', 'role' => 'finance']);
        $this->warehouse = User::factory()->create(['name' => 'Warehouse Keeper', 'email' => 'warehouse_uat@example.com', 'role' => 'warehouse']);

        // 2. Create Master Data
        $this->catA = Category::create(['name' => 'Bahan Bangunan', 'code' => 'CAT-BB']);
        $this->catB = Category::create(['name' => 'Cat & Liquid', 'code' => 'CAT-CL']);

        $this->unitPcs = Unit::create(['name' => 'Pcs', 'code' => 'PCS']);
        $this->unitLiter = Unit::create(['name' => 'Liter', 'code' => 'LTR']);
        $this->unitKg = Unit::create(['name' => 'Kilogram', 'code' => 'KG']);
        $this->unitMeter = Unit::create(['name' => 'Meter', 'code' => 'MTR']);

        $this->prod1 = Product::create([
            'category_id' => $this->catA->id,
            'unit_id' => $this->unitPcs->id,
            'name' => 'Semen Gresik 50kg',
            'code' => 'PRD-SMN-01',
        ]);

        $this->prod2 = Product::create([
            'category_id' => $this->catB->id,
            'unit_id' => $this->unitLiter->id,
            'name' => 'Cat Tembok Nippon Paint',
            'code' => 'PRD-CAT-02',
        ]);

        $this->prod3 = Product::create([
            'category_id' => $this->catA->id,
            'unit_id' => $this->unitKg->id,
            'name' => 'Paku Kayu 3 Inch',
            'code' => 'PRD-PKU-03',
        ]);

        $this->prod4 = Product::create([
            'category_id' => $this->catA->id,
            'unit_id' => $this->unitMeter->id,
            'name' => 'Pipa PVC 2 Inch',
            'code' => 'PRD-PPA-04',
        ]);

        $this->supA = Supplier::create([
            'name' => 'PT Sinar Jaya Abadi',
            'code' => 'SUP-SJA',
            'phone' => '08123456789',
        ]);

        $this->supB = Supplier::create([
            'name' => 'CV Mega Utama',
            'code' => 'SUP-MU',
            'phone' => '08987654321',
        ]);

        $this->projAlpha = Project::create([
            'name' => 'Renovasi Ruko Sulis',
            'code' => 'PRJ-ALPHA',
            'revenue' => 10000000.00,
            'status' => 'active',
        ]);

        $this->projBeta = Project::create([
            'name' => 'Pembangunan Gudang B',
            'code' => 'PRJ-BETA',
            'revenue' => 25000000.00,
            'status' => 'active',
        ]);
    }

    /** @test */
    public function uat_scenario_purchasing_lifecycle_and_decimal_precision()
    {
        // 1. Create DRAFT Purchase A
        $purA = Purchase::create([
            'supplier_id' => $this->supA->id,
            'purchase_number' => 'PO-2026-001',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 2550000.00,
            'created_by' => $this->finance->id,
        ]);

        $purA->items()->create([
            'product_id' => $this->prod1->id,
            'quantity' => 10,
            'unit_cost' => 50000,
            'subtotal' => 500000,
        ]);

        $purA->items()->create([
            'product_id' => $this->prod2->id,
            'quantity' => 20.500,
            'unit_cost' => 100000,
            'subtotal' => 2050000,
        ]);

        // DRAFT must not affect stock
        $stockProd1 = InventoryStock::where('product_id', $this->prod1->id)->first();
        $this->assertNull($stockProd1);

        // Confirm Purchase A
        $res = $this->actingAs($this->finance)->postJson("/api/v1/purchases/{$purA->id}/confirm");
        $res->assertStatus(200);

        // Verify stock increases with exact integer & decimal precision
        $stock1 = InventoryStock::where('product_id', $this->prod1->id)->first();
        $this->assertEquals(10, (float) $stock1->quantity);

        $stock2 = InventoryStock::where('product_id', $this->prod2->id)->first();
        $this->assertEquals(20.5, (float) $stock2->quantity); // NO INTEGER TRUNCATION

        // Create CANCELLED Purchase B
        $purB = Purchase::create([
            'supplier_id' => $this->supB->id,
            'purchase_number' => 'PO-2026-002',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 1260000.00,
            'created_by' => $this->finance->id,
        ]);

        $purB->items()->create([
            'product_id' => $this->prod3->id,
            'quantity' => 15.750,
            'unit_cost' => 80000,
            'subtotal' => 1260000,
        ]);

        // Cancel Purchase B
        $cancelRes = $this->actingAs($this->finance)->postJson("/api/v1/purchases/{$purB->id}/cancel");
        $cancelRes->assertStatus(200);

        // Stock for Prod 3 must remain null/0
        $stock3 = InventoryStock::where('product_id', $this->prod3->id)->first();
        $this->assertNull($stock3);
    }

    /** @test */
    public function uat_scenario_project_isolation_and_negative_stock_prevention()
    {
        // Purchase 20.500 L of Prod2
        $pur = Purchase::create([
            'supplier_id' => $this->supA->id,
            'purchase_number' => 'PO-DECIMAL-1',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 2050000,
            'created_by' => $this->finance->id,
        ]);
        $pur->items()->create([
            'product_id' => $this->prod2->id,
            'quantity' => 20.500,
            'unit_cost' => 100000,
            'subtotal' => 2050000,
        ]);
        $this->actingAs($this->finance)->postJson("/api/v1/purchases/{$pur->id}/confirm");

        // Usage 4.250 L for Project Alpha
        $useAlpha = $this->actingAs($this->warehouse)->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->prod2->id,
            'project_id' => $this->projAlpha->id,
            'quantity' => 4.250,
            'transaction_date' => now()->toDateString(),
        ]);
        $useAlpha->assertStatus(201);

        $stockAfterAlpha = InventoryStock::where('product_id', $this->prod2->id)->first();
        $this->assertEquals(16.25, (float) $stockAfterAlpha->quantity);

        // Usage 5.500 L for Project Beta
        $useBeta = $this->actingAs($this->warehouse)->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->prod2->id,
            'project_id' => $this->projBeta->id,
            'quantity' => 5.500,
            'transaction_date' => now()->toDateString(),
        ]);
        $useBeta->assertStatus(201);

        $stockAfterBeta = InventoryStock::where('product_id', $this->prod2->id)->first();
        $this->assertEquals(10.75, (float) $stockAfterBeta->quantity);

        // Check movements are isolated by project
        $alphaMovements = InventoryMovement::where('project_id', $this->projAlpha->id)->get();
        $this->assertCount(1, $alphaMovements);
        $this->assertEquals(4.25, (float) $alphaMovements->first()->quantity);

        $betaMovements = InventoryMovement::where('project_id', $this->projBeta->id)->get();
        $this->assertCount(1, $betaMovements);
        $this->assertEquals(5.5, (float) $betaMovements->first()->quantity);

        // NEGATIVE STOCK TEST: Try to use 50 L when remaining is 10.75 L
        $excessUse = $this->actingAs($this->warehouse)->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->prod2->id,
            'project_id' => $this->projAlpha->id,
            'quantity' => 50.000,
            'transaction_date' => now()->toDateString(),
        ]);
        $this->assertTrue(in_array($excessUse->status(), [400, 422])); // Transaction rejected

        // Stock remains 10.75 L
        $stockFinal = InventoryStock::where('product_id', $this->prod2->id)->first();
        $this->assertEquals(10.75, (float) $stockFinal->quantity);
    }

    /** @test */
    public function uat_scenario_project_profitability_and_expenses()
    {
        // Stock In Prod 2 @ 100,000 cost
        $pur = Purchase::create([
            'supplier_id' => $this->supA->id,
            'purchase_number' => 'PO-PROF-1',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 1000000,
            'created_by' => $this->finance->id,
        ]);
        $pur->items()->create([
            'product_id' => $this->prod2->id,
            'quantity' => 10,
            'unit_cost' => 100000,
            'subtotal' => 1000000,
        ]);
        $this->actingAs($this->finance)->postJson("/api/v1/purchases/{$pur->id}/confirm");

        // Project Alpha Usage: 4.250 L = 425,000 cost
        $this->actingAs($this->warehouse)->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->prod2->id,
            'project_id' => $this->projAlpha->id,
            'quantity' => 4.250,
            'transaction_date' => now()->toDateString(),
        ]);

        // Add Project Alpha Expenses: 750,000
        ProjectExpense::create([
            'project_id' => $this->projAlpha->id,
            'description' => 'Biaya Tukang & Logistik',
            'amount' => 750000.00,
            'expense_date' => now()->toDateString(),
            'created_by' => $this->finance->id,
        ]);

        // Revenue = 10,000,000
        // Material Cost = 425,000
        // Other Expenses = 750,000
        // Total Cost = 1,175,000
        // Gross Profit = 8,825,000
        // Margin = (8,825,000 / 10,000,000) * 100 = 88.25%

        $res = $this->actingAs($this->finance)->getJson("/api/v1/reports/projects/{$this->projAlpha->id}/cost-detail");
        $res->assertStatus(200)
            ->assertJsonPath('revenue', 10000000)
            ->assertJsonPath('material_cost', 425000)
            ->assertJsonPath('other_expenses', 750000)
            ->assertJsonPath('total_cost', 1175000)
            ->assertJsonPath('gross_profit', 8825000)
            ->assertJsonPath('margin_percent', 88.25);
    }

    /** @test */
    public function uat_scenario_stock_opname_decimal_adjustments()
    {
        // Stock In Prod 2: 10.750 L
        $pur = Purchase::create([
            'supplier_id' => $this->supA->id,
            'purchase_number' => 'PO-SO-1',
            'purchase_date' => now()->toDateString(),
            'status' => 'DRAFT',
            'total_amount' => 1075000,
            'created_by' => $this->finance->id,
        ]);
        $pur->items()->create([
            'product_id' => $this->prod2->id,
            'quantity' => 10.750,
            'unit_cost' => 100000,
            'subtotal' => 1075000,
        ]);
        $this->actingAs($this->finance)->postJson("/api/v1/purchases/{$pur->id}/confirm");

        // Stock Opname: Physical = 8.500 L (Negative diff = -2.250 L)
        $soRes = $this->actingAs($this->warehouse)->postJson('/api/v1/stock-opnames', [
            'opname_number' => 'SO-UAT-001',
            'opname_date' => now()->toDateString(),
        ]);
        $soId = $soRes->json('id');

        $this->actingAs($this->warehouse)->postJson("/api/v1/stock-opnames/{$soId}/items", [
            'product_id' => $this->prod2->id,
            'physical_quantity' => 8.500,
        ]);

        $completeRes = $this->actingAs($this->warehouse)->postJson("/api/v1/stock-opnames/{$soId}/complete");
        $completeRes->assertStatus(200);

        // Verify stock is adjusted to 8.500
        $stock = InventoryStock::where('product_id', $this->prod2->id)->first();
        $this->assertEquals(8.5, (float) $stock->quantity);

        // Verify movement recorded as ADJUSTMENT_OUT
        $adjMovement = InventoryMovement::whereIn('reference_type', ['stock_opname', 'STOCK_OPNAME'])
            ->where('reference_id', $soId)
            ->first();
        $this->assertNotNull($adjMovement);
        $this->assertEquals('ADJUSTMENT_OUT', $adjMovement->type);
        $this->assertEquals(2.25, (float) $adjMovement->quantity);

        // Verify completed opname cannot be edited
        $editAttempt = $this->actingAs($this->warehouse)->postJson("/api/v1/stock-opnames/{$soId}/items", [
            'product_id' => $this->prod1->id,
            'physical_quantity' => 5,
        ]);
        $editAttempt->assertStatus(422);
    }

    /** @test */
    public function uat_scenario_role_authorization_and_forbidden_routes()
    {
        // Warehouse cannot access purchasing
        $whPur = $this->actingAs($this->warehouse)->getJson('/api/v1/purchases');
        $whPur->assertStatus(403);

        // Warehouse cannot access financial reports
        $whFin = $this->actingAs($this->warehouse)->getJson('/api/v1/reports/financial-overview');
        $whFin->assertStatus(403);

        // Finance can access financial reports and purchasing
        $finOverview = $this->actingAs($this->finance)->getJson('/api/v1/reports/financial-overview');
        $finOverview->assertStatus(200);

        // Owner can access all
        $ownerOverview = $this->actingAs($this->owner)->getJson('/api/v1/reports/financial-overview');
        $ownerOverview->assertStatus(200);
    }
}
