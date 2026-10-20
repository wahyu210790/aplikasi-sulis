<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MainBusinessFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;
    private User $finance;
    private User $warehouse;
    private Supplier $supplier;
    private Product $product;
    private Project $project;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Roles
        $this->owner = User::factory()->create(['role' => 'owner', 'name' => 'Owner Sulis']);
        $this->finance = User::factory()->create(['role' => 'finance', 'name' => 'Finance Sulis']);
        $this->warehouse = User::factory()->create(['role' => 'warehouse', 'name' => 'Warehouse Sulis']);

        // 2. Master Data
        $category = Category::create(['name' => 'Material Konstruksi', 'code' => 'CAT-MK']);
        $unit = Unit::create(['name' => 'Meter', 'code' => 'MTR']);
        $this->supplier = Supplier::create([
            'name' => 'PT Mitra Baja Mandiri',
            'code' => 'SUP-MBM',
        ]);

        $this->product = Product::create([
            'name' => 'Baja Ringan C75',
            'code' => 'PRD-BR-01',
            'category_id' => $category->id,
            'unit_id' => $unit->id,
        ]);

        $this->project = Project::create([
            'name' => 'Proyek Renovasi Pabrik',
            'code' => 'PRJ-RENOV-01',
            'revenue' => 15000000.00,
            'status' => 'active',
        ]);
    }

    /** @test */
    public function complete_business_lifecycle_from_purchasing_to_profitability()
    {
        // ---------------------------------------------------------------------
        // 1. MEMBUAT PO DRAFT TIDAK MENGUBAH STOK
        // ---------------------------------------------------------------------
        $poPayload1 = [
            'supplier_id' => $this->supplier->id,
            'purchase_date' => now()->toDateString(),
            'notes' => 'Pembelian batch 1 baja ringan',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10,
                    'unit_cost' => 100000.00, // Subtotal 1,000,000
                ],
            ],
        ];

        $draftResponse = $this->actingAs($this->finance, 'sanctum')->postJson('/api/v1/purchases', $poPayload1);
        $draftResponse->assertCreated();
        $draftResponse->assertJsonPath('status', 'DRAFT');
        $poId1 = $draftResponse->json('id');

        // Verifikasi: PO Draft tidak boleh menghasilkan inventory stock maupun movement
        $stockBeforeConfirm = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertNull($stockBeforeConfirm);
        $this->assertDatabaseMissing('inventory_movements', [
            'product_id' => $this->product->id,
        ]);

        // ---------------------------------------------------------------------
        // 2. MENGONFIRMASI PO MENAMBAH STOK TEPAT SATU KALI
        // ---------------------------------------------------------------------
        $confirmResponse = $this->actingAs($this->finance, 'sanctum')->postJson("/api/v1/purchases/{$poId1}/confirm");
        $confirmResponse->assertOk();
        $confirmResponse->assertJsonPath('status', 'CONFIRMED');

        $stockAfterConfirm1 = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertNotNull($stockAfterConfirm1);
        $this->assertEquals(10, (float) $stockAfterConfirm1->quantity);
        $this->assertEquals(100000, (float) $stockAfterConfirm1->average_cost);
        $this->assertEquals(1000000, (float) $stockAfterConfirm1->total_value);

        $movementCount1 = InventoryMovement::where('product_id', $this->product->id)
            ->where('type', 'PURCHASE_IN')
            ->count();
        $this->assertEquals(1, $movementCount1);

        // ---------------------------------------------------------------------
        // 3. MENGONFIRMASI PO YANG SAMA LAGI DITOLAK TANPA PERUBAHAN STOK
        // ---------------------------------------------------------------------
        $duplicateConfirm = $this->actingAs($this->finance, 'sanctum')->postJson("/api/v1/purchases/{$poId1}/confirm");
        $duplicateConfirm->assertStatus(422);

        $stockAfterDuplicateAttempt = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(10, (float) $stockAfterDuplicateAttempt->quantity);
        $this->assertEquals(100000, (float) $stockAfterDuplicateAttempt->average_cost);

        $movementCountDuplicate = InventoryMovement::where('product_id', $this->product->id)
            ->where('type', 'PURCHASE_IN')
            ->count();
        $this->assertEquals(1, $movementCountDuplicate); // Tetap tepat 1 kali

        // ---------------------------------------------------------------------
        // 4. PEMBELIAN KEDUA MEMPERBARUI MOVING AVERAGE COST
        //    Batch 1: 10 unit @ 100,000 = 1,000,000
        //    Batch 2: 10 unit @ 120,000 = 1,200,000
        //    Total:   20 unit @ 110,000 = 2,200,000
        // ---------------------------------------------------------------------
        $poPayload2 = [
            'supplier_id' => $this->supplier->id,
            'purchase_date' => now()->toDateString(),
            'notes' => 'Pembelian batch 2 kenaikan harga',
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 10,
                    'unit_cost' => 120000.00,
                ],
            ],
        ];

        $po2 = $this->actingAs($this->finance, 'sanctum')->postJson('/api/v1/purchases', $poPayload2);
        $poId2 = $po2->json('id');
        $this->actingAs($this->finance, 'sanctum')->postJson("/api/v1/purchases/{$poId2}/confirm")->assertOk();

        $stockBatch2 = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(20, (float) $stockBatch2->quantity);
        $this->assertEquals(110000, (float) $stockBatch2->average_cost);
        $this->assertEquals(2200000, (float) $stockBatch2->total_value);

        // ---------------------------------------------------------------------
        // 5. STOK TIDAK BOLEH NEGATIF JIKA PENGGUNAAN MELEBIHI STOK TERSEDIA
        //    Tersedia: 20 unit. Coba gunakan: 25 unit untuk proyek.
        // ---------------------------------------------------------------------
        $excessUsageResponse = $this->actingAs($this->warehouse, 'sanctum')->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->product->id,
            'project_id' => $this->project->id,
            'quantity' => 25,
            'transaction_date' => now()->toDateTimeString(),
        ]);
        $this->assertTrue(in_array($excessUsageResponse->status(), [400, 422]));

        // Pastikan stok tidak terpotong
        $stockAfterExcess = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(20, (float) $stockAfterExcess->quantity);
        $this->assertEquals(110000, (float) $stockAfterExcess->average_cost);

        // ---------------------------------------------------------------------
        // 6. PROJECT USAGE MENGURANGI STOK SESUAI KUANTITAS DAN MENGGUNAKAN
        //    MOVING AVERAGE COST YANG BERLAKU
        //    Gunakan 8 unit untuk proyek.
        //    Biaya material harus 8 * 110,000 = 880,000.
        //    Sisa stok harus 12 unit @ 110,000 = 1,320,000.
        // ---------------------------------------------------------------------
        $usageResponse = $this->actingAs($this->warehouse, 'sanctum')->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->product->id,
            'project_id' => $this->project->id,
            'quantity' => 8,
            'transaction_date' => now()->toDateTimeString(),
        ]);
        $usageResponse->assertCreated();

        $stockAfterUsage = InventoryStock::where('product_id', $this->product->id)->first();
        $this->assertEquals(12, (float) $stockAfterUsage->quantity);
        $this->assertEquals(110000, (float) $stockAfterUsage->average_cost);
        $this->assertEquals(1320000, (float) $stockAfterUsage->total_value);

        $usageMovement = InventoryMovement::where('product_id', $this->product->id)
            ->where('project_id', $this->project->id)
            ->where('type', 'PROJECT_USAGE')
            ->first();
        $this->assertNotNull($usageMovement);
        $this->assertEquals(8, (float) $usageMovement->quantity);
        $this->assertEquals(110000, (float) $usageMovement->unit_cost);
        $this->assertEquals(880000, (float) $usageMovement->total_cost);

        // ---------------------------------------------------------------------
        // 7. EXPENSE PROYEK DAN LAPORAN PROFITABILITAS
        //    Pendapatan Proyek: 15,000,000
        //    Biaya Material:      880,000
        //    Biaya Operasional: 1,120,000
        //    Total Biaya:       2,000,000
        //    Gross Profit:     13,000,000
        //    Margin:           (13,000,000 / 15,000,000) * 100 = 86.67%
        // ---------------------------------------------------------------------
        ProjectExpense::create([
            'project_id' => $this->project->id,
            'description' => 'Upah Tenaga Pasang Baja Ringan',
            'amount' => 1120000.00,
            'expense_date' => now()->toDateString(),
            'created_by' => $this->finance->id,
        ]);

        // Verifikasi endpoint /projects/{id}/profitability
        $profitabilityResponse = $this->actingAs($this->owner, 'sanctum')
            ->getJson("/api/v1/projects/{$this->project->id}/profitability");
        $profitabilityResponse->assertOk();
        $profitabilityResponse->assertJsonFragment([
            'revenue' => 15000000,
            'material_cost' => 880000,
            'other_expenses' => 1120000,
            'total_cost' => 2000000,
            'gross_profit' => 13000000,
            'margin_percent' => 86.67,
        ]);

        // Verifikasi endpoint /reports/projects/{id}/cost-detail
        $reportResponse = $this->actingAs($this->finance, 'sanctum')
            ->getJson("/api/v1/reports/projects/{$this->project->id}/cost-detail");
        $reportResponse->assertOk();
        $reportResponse->assertJsonPath('revenue', 15000000);
        $reportResponse->assertJsonPath('material_cost', 880000);
        $reportResponse->assertJsonPath('other_expenses', 1120000);
        $reportResponse->assertJsonPath('total_cost', 2000000);
        $reportResponse->assertJsonPath('gross_profit', 13000000);
        $reportResponse->assertJsonPath('margin_percent', 86.67);
    }
}
