<?php

namespace Tests\Feature;

use App\Models\InventoryMovement;
use App\Models\InventoryStock;
use App\Models\Product;
use App\Models\Project;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression tests for production-readiness hardening:
 *  - Purchase status transitions cannot double-apply or overwrite stock effects.
 *  - Unit mutations are restricted to owner & warehouse.
 *  - Project expenses require an existing project.
 *  - Real Bearer-token flow (login -> token -> protected endpoint) works end to end.
 */
class ProductionHardeningTest extends TestCase
{
    use RefreshDatabase;

    private function makeDraftPurchase(User $creator, Product $product, float $qty = 5, float $cost = 1000): Purchase
    {
        $supplier = Supplier::factory()->create();
        $response = $this->actingAs($creator, 'sanctum')->postJson('/api/v1/purchases', [
            'supplier_id'   => $supplier->id,
            'purchase_date' => '2026-01-01',
            'items'         => [['product_id' => $product->id, 'quantity' => $qty, 'unit_cost' => $cost]],
        ]);
        $response->assertCreated();
        return Purchase::findOrFail($response->json('id'));
    }

    public function test_cancelled_purchase_cannot_be_confirmed_and_adds_no_stock(): void
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $product = Product::factory()->create();
        $purchase = $this->makeDraftPurchase($finance, $product);

        $this->actingAs($finance, 'sanctum')->postJson("/api/v1/purchases/{$purchase->id}/cancel")->assertOk();
        $this->actingAs($finance, 'sanctum')->postJson("/api/v1/purchases/{$purchase->id}/confirm")->assertStatus(422);

        $this->assertSame('CANCELLED', $purchase->fresh()->status);
        $this->assertNull(InventoryStock::where('product_id', $product->id)->first());
        $this->assertSame(0, InventoryMovement::where('product_id', $product->id)->count());
    }

    public function test_confirmed_purchase_cannot_be_cancelled_and_stock_is_kept(): void
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $product = Product::factory()->create();
        $purchase = $this->makeDraftPurchase($finance, $product, 4, 2500);

        $this->actingAs($finance, 'sanctum')->postJson("/api/v1/purchases/{$purchase->id}/confirm")->assertOk();
        $this->actingAs($finance, 'sanctum')->postJson("/api/v1/purchases/{$purchase->id}/cancel")->assertStatus(422);

        $this->assertSame('CONFIRMED', $purchase->fresh()->status);
        $this->assertEquals(4, (float) InventoryStock::where('product_id', $product->id)->value('quantity'));
        $this->assertSame(1, InventoryMovement::where('product_id', $product->id)->where('type', 'PURCHASE_IN')->count());
    }

    public function test_finance_cannot_record_project_usage(): void
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $product = Product::factory()->create();
        $project = Project::factory()->create(['status' => 'active']);

        $this->actingAs($finance, 'sanctum')->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $product->id,
            'project_id' => $project->id,
            'quantity' => 1,
            'transaction_date' => '2026-01-01',
        ])->assertForbidden();
    }

    public function test_finance_cannot_mutate_units(): void
    {
        $finance = User::factory()->create(['role' => 'finance']);
        $unit = Unit::factory()->create();

        $this->actingAs($finance, 'sanctum')->postJson('/api/v1/units', ['name' => 'Box', 'code' => 'BOX'])->assertForbidden();
        $this->actingAs($finance, 'sanctum')->putJson("/api/v1/units/{$unit->id}", ['name' => 'Changed'])->assertForbidden();
        $this->actingAs($finance, 'sanctum')->deleteJson("/api/v1/units/{$unit->id}")->assertForbidden();

        $this->assertDatabaseHas('units', ['id' => $unit->id]);
        $this->assertDatabaseMissing('units', ['code' => 'BOX']);
        // Reading units remains available to every authenticated role
        $this->actingAs($finance, 'sanctum')->getJson('/api/v1/units')->assertOk();
    }

    public function test_owner_and_warehouse_can_create_units(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $warehouse = User::factory()->create(['role' => 'warehouse']);

        $this->actingAs($owner, 'sanctum')->postJson('/api/v1/units', ['name' => 'Box', 'code' => 'BOX'])->assertCreated();
        $this->actingAs($warehouse, 'sanctum')->postJson('/api/v1/units', ['name' => 'Roll', 'code' => 'ROLL'])->assertCreated();
    }

    public function test_expense_for_missing_project_returns_404(): void
    {
        $owner = User::factory()->create(['role' => 'owner']);

        $this->actingAs($owner, 'sanctum')->postJson('/api/v1/projects/999999/expenses', [
            'description' => 'Test',
            'amount' => 1000,
            'expense_date' => '2026-01-01',
        ])->assertNotFound();

        $this->assertDatabaseCount('project_expenses', 0);
    }

    public function test_real_bearer_token_flow_and_logout_revokes_token(): void
    {
        $user = User::factory()->create(['role' => 'warehouse', 'email' => 'bearer@example.test']);

        $login = $this->postJson('/api/v1/auth/login', ['email' => 'bearer@example.test', 'password' => 'password']);
        $login->assertOk();
        $token = $login->json('data.access_token');
        $this->assertNotEmpty($token);

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->getJson('/api/v1/auth/me')
            ->assertOk();

        $this->withHeader('Authorization', 'Bearer '.$token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_protected_endpoint_rejects_missing_token_with_json_401(): void
    {
        $this->getJson('/api/v1/products')->assertUnauthorized();
    }

    public function test_invalid_login_is_rejected(): void
    {
        User::factory()->create(['email' => 'someone@example.test']);
        $this->postJson('/api/v1/auth/login', ['email' => 'someone@example.test', 'password' => 'wrong'])
            ->assertUnauthorized();
    }

    public function test_inventory_stocks_product_id_has_unique_and_foreign_key_constraints(): void
    {
        $indexes = \Illuminate\Support\Facades\Schema::getIndexes('inventory_stocks');
        $hasUniqueOnProductId = collect($indexes)->contains(function (array $index): bool {
            return ! empty($index['unique']) && ($index['columns'] ?? []) === ['product_id'];
        });
        $this->assertTrue($hasUniqueOnProductId, 'Expected a database-level UNIQUE index on inventory_stocks.product_id');

        $foreignKeys = \Illuminate\Support\Facades\Schema::getForeignKeys('inventory_stocks');
        $hasFkToProducts = collect($foreignKeys)->contains(function (array $fk): bool {
            return ($fk['columns'] ?? []) === ['product_id'] && ($fk['foreign_table'] ?? null) === 'products';
        });
        $this->assertTrue($hasFkToProducts, 'Expected a foreign key constraint from inventory_stocks.product_id to products.id');

        $product = Product::factory()->create();
        InventoryStock::create([
            'product_id' => $product->id,
            'quantity' => 5,
            'average_cost' => 1000,
            'total_value' => 5000,
        ]);

        $this->expectException(\Illuminate\Database\UniqueConstraintViolationException::class);
        \Illuminate\Support\Facades\DB::table('inventory_stocks')->insert([
            'product_id' => $product->id,
            'quantity' => 1,
            'average_cost' => 1000,
            'total_value' => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_seeders_do_not_create_sample_users_in_production_environment(): void
    {
        $originalEnv = app()->environment();
        try {
            app()->detectEnvironment(fn () => 'production');
            $this->assertTrue(app()->isProduction());

            (new \Database\Seeders\DatabaseSeeder())->run();
            (new \Database\Seeders\UserSeeder())->run();

            $this->assertSame(0, User::count());
        } finally {
            app()->detectEnvironment(fn () => $originalEnv);
        }
    }

    public function test_projects_revenue_column_has_single_source_of_truth_and_survives_rollback(): void
    {
        $addRevenueMigration = require database_path('migrations/2026_10_05_000001_add_revenue_to_projects_table.php');

        $upQueries = \Illuminate\Support\Facades\DB::pretend(fn () => $addRevenueMigration->up());
        $downQueries = \Illuminate\Support\Facades\DB::pretend(fn () => $addRevenueMigration->down());

        $this->assertSame([], $upQueries, '2026_10_05_000001_add_revenue_to_projects_table::up() must not emit conflicting DDL');
        $this->assertSame([], $downQueries, '2026_10_05_000001_add_revenue_to_projects_table::down() must not drop projects.revenue');
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasColumn('projects', 'revenue'));

        $owner = User::factory()->create(['role' => 'owner']);
        $projectNullRevenue = Project::create([
            'code' => 'PRJ-NULL-REV',
            'name' => 'Proyek Tanpa Revenue Awal',
            'revenue' => null,
            'status' => 'active',
        ]);
        $this->assertNull($projectNullRevenue->fresh()->revenue);

        $this->actingAs($owner, 'sanctum')
            ->getJson("/api/v1/projects/{$projectNullRevenue->id}/profitability")
            ->assertOk()
            ->assertJsonPath('margin_percent', 0);
    }
}
