<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Project;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\AssertsNoMoneyKeys;
use Tests\TestCase;

/**
 * docs/desain-v2.md B7: Gudang never receives money keys.
 * Later tasks ADD a test here for every new endpoint Gudang can call.
 */
class MoneyHidingTest extends TestCase
{
    use AssertsNoMoneyKeys;
    use RefreshDatabase;

    private Product $product;

    protected function setUp(): void
    {
        parent::setUp();
        $this->product = Product::factory()->create(['sku' => 'KBL-001', 'min_stock' => '50']);
        $this->product->stockBalance->update(['qty' => '115', 'avg_cost' => '11500', 'stock_value' => 1322500, 'has_cost' => true]);
    }

    public function test_gudang_gets_no_money_keys_from_product_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->assertNoMoneyKeys($this->getJson('/api/v1/products'));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/products?low_stock=1'));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/products/{$this->product->id}"));

        $this->getJson("/api/v1/products/{$this->product->id}")
            ->assertJsonPath('data.stock', ['qty' => '115.000']);
    }

    public function test_gudang_gets_no_money_keys_after_create_or_update(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());
        $payload = [
            'sku' => 'PP-001',
            'name' => 'Pipa PVC',
            'category_id' => Category::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
        ];

        $created = $this->postJson('/api/v1/products', $payload)->assertCreated();
        $this->assertNoMoneyKeys($created);

        $id = $created->json('data.id');
        $this->assertNoMoneyKeys($this->putJson("/api/v1/products/{$id}", [...$payload, 'is_active' => true]));
    }

    public function test_gudang_gets_no_money_keys_from_categories_and_units(): void
    {
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->assertNoMoneyKeys($this->getJson('/api/v1/categories'));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/units?all=1'));
    }

    public function test_gudang_gets_no_money_keys_from_projects(): void
    {
        $project = Project::factory()->create(['contract_value' => 150000000]);
        Sanctum::actingAs(User::factory()->gudang()->create());

        $this->assertNoMoneyKeys($this->getJson('/api/v1/projects'));
        $this->assertNoMoneyKeys($this->getJson('/api/v1/projects?all=1'));
        $this->assertNoMoneyKeys($this->getJson("/api/v1/projects/{$project->id}"));
    }

    public function test_owner_and_finance_do_get_money_keys(): void
    {
        $project = Project::factory()->create(['contract_value' => 150000000]);

        foreach (['owner', 'finance'] as $role) {
            Sanctum::actingAs(User::factory()->state(['role' => $role])->create());

            $this->getJson("/api/v1/products/{$this->product->id}")
                ->assertOk()
                ->assertJsonPath('data.stock.avg_cost', '11500.0000')
                ->assertJsonPath('data.stock.stock_value', 1322500)
                ->assertJsonPath('data.stock.has_cost', true);

            $this->getJson("/api/v1/projects/{$project->id}")
                ->assertOk()
                ->assertJsonPath('data.contract_value', 150000000);
        }
    }
}
