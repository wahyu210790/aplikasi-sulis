<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Project;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * docs/desain-v2.md B13 A/B scenario: cable bought "for project A" is issued by Gudang user Andi
 * to project B, taken by Budi. Every report must show it under B (never under A).
 */
class ProjectTraceabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_stock_bought_for_project_a_but_issued_to_project_b_is_traced_to_b(): void
    {
        $this->travelTo('2026-10-27 10:00:00');
        $andi = User::factory()->gudang()->create(['name' => 'Andi']);
        $projectA = Project::factory()->create(['code' => 'PRJ-A', 'name' => 'Proyek A']);
        $projectB = Project::factory()->create(['code' => 'PRJ-B', 'name' => 'Proyek B']);
        $cable = Product::factory()->create(['sku' => 'KBL-NYM-2X15', 'name' => 'Kabel NYM 2x1.5', 'unit_id' => Unit::factory()->create(['symbol' => 'mtr'])->id]);

        Sanctum::actingAs(User::factory()->finance()->create());
        $purchaseId = $this->postJson('/api/v1/purchases', [
            'supplier_id' => Supplier::factory()->create()->id,
            'purchase_date' => '2026-10-25',
            'notes' => 'Untuk proyek A (PRJ-A)',
            'items' => [['product_id' => $cable->id, 'qty' => '100', 'unit_price' => 11500]],
        ])->assertCreated()->json('data.id');

        Sanctum::actingAs($andi);
        $this->postJson("/api/v1/purchases/{$purchaseId}/receive")->assertOk();
        $document = $this->postJson('/api/v1/stock-outs', [
            'project_id' => $projectB->id,
            'person_name' => 'Budi',
            'transaction_date' => '2026-10-26',
            'items' => [['product_id' => $cable->id, 'qty' => '80']],
        ])->assertCreated()->json('data');
        $this->assertSame('BK-000001', $document['number']);

        foreach (['owner', 'gudang', 'finance'] as $role) {
            Sanctum::actingAs(User::factory()->state(['role' => $role])->create());

            // Movements report for project B: product, 80 m, Budi, Andi, date, document number.
            $rows = $this->getJson("/api/v1/reports/movements?project_id={$projectB->id}")->assertOk()->json('data');
            $this->assertCount(1, $rows);
            $this->assertSame('project_out', $rows[0]['type']);
            $this->assertSame('Keluar ke Proyek', $rows[0]['type_label']);
            $this->assertSame(['id' => $cable->id, 'sku' => 'KBL-NYM-2X15', 'name' => 'Kabel NYM 2x1.5', 'unit_symbol' => 'mtr'], $rows[0]['product']);
            $this->assertSame('-80.000', $rows[0]['qty_change']);
            $this->assertSame('20.000', $rows[0]['qty_after']);
            $this->assertSame(['id' => $projectB->id, 'code' => 'PRJ-B', 'name' => 'Proyek B'], $rows[0]['project']);
            $this->assertSame(['kind' => 'stock_transaction', 'id' => $document['id'], 'number' => 'BK-000001'], $rows[0]['document']);
            $this->assertSame('Budi', $rows[0]['person_name']);
            $this->assertSame(['id' => $andi->id, 'name' => 'Andi'], $rows[0]['created_by']);
            $this->assertSame('2026-10-26', $rows[0]['movement_date']);

            // Stock documents for project B.
            $documents = $this->getJson("/api/v1/stock-transactions?project_id={$projectB->id}")->assertOk()->json('data');
            $this->assertSame(['BK-000001', 'Budi', 'Andi', '2026-10-26', 1], [
                $documents[0]['number'], $documents[0]['person_name'], $documents[0]['created_by']['name'], $documents[0]['transaction_date'], $documents[0]['lines_count'],
            ]);

            // Project A shows nothing, although the purchase note mentions it.
            $this->getJson("/api/v1/reports/movements?project_id={$projectA->id}")->assertOk()->assertJsonCount(0, 'data');
            $this->getJson("/api/v1/stock-transactions?project_id={$projectA->id}")->assertOk()->assertJsonCount(0, 'data');
            $this->getJson("/api/v1/projects/{$projectA->id}/issued-items")->assertOk()->assertJsonCount(0, 'data');
            $this->getJson("/api/v1/projects/{$projectB->id}/issued-items")->assertOk()->assertJsonPath('data.0.qty', '80.000');

            // Product ledger: newest first, the out movement then the purchase.
            $ledger = $this->getJson("/api/v1/products/{$cable->id}/movements")->assertOk()->json('data');
            $this->assertSame(['project_out', 'purchase_in'], array_column($ledger, 'type'));
            $this->assertSame(['BK-000001', 'PB-000001'], array_column(array_column($ledger, 'document'), 'number'));
            $this->assertSame('Budi', $ledger[0]['person_name']);

            // Remaining stock.
            $this->getJson("/api/v1/products/{$cable->id}")->assertOk()->assertJsonPath('data.stock.qty', '20.000');
        }
    }
}
