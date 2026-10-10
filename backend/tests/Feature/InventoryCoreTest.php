<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class InventoryCoreTest extends TestCase
{
    use RefreshDatabase;

    protected $owner;
    protected $warehouse;
    protected $finance;
    protected $product;
    protected $projectActive;
    protected $projectCancelled;

    protected function setUp(): void
    {
        parent::setUp();
        // Users
        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->warehouse = User::factory()->create(['role' => 'warehouse']);
        $this->finance = User::factory()->create(['role' => 'finance']);
        // Category for product
        $category = \App\Models\Category::factory()->create();
        // Product with category
        $this->product = Product::factory()->create(['category_id' => $category->id]);
        // Projects
        $this->projectActive = Project::factory()->create(['status' => 'active']);
        $this->projectCancelled = Project::factory()->create(['status' => 'cancelled']);
    }

    /** Helper to perform request as a given user */
    protected function asUser($user)
    {
        Sanctum::actingAs($user);
    }

    public function test_purchase_in_adds_stock_and_moving_average()
    {
        $this->asUser($this->warehouse);
        $payload = [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_cost' => 100000,
            'transaction_date' => now()->toDateTimeString(),
        ];
        $response = $this->postJson('/api/v1/inventory/purchase-in', $payload);
        $response->assertCreated();
        $this->assertDatabaseHas('inventory_stocks', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'average_cost' => 100000,
        ]);
    }

    public function test_second_purchase_updates_moving_average()
    {
        $this->asUser($this->warehouse);
        // first purchase
        $this->postJson('/api/v1/inventory/purchase-in', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_cost' => 100000,
            'transaction_date' => now()->toDateTimeString(),
        ])->assertCreated();
        // second purchase with different cost
        $this->postJson('/api/v1/inventory/purchase-in', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_cost' => 120000,
            'transaction_date' => now()->toDateTimeString(),
        ])->assertCreated();
        $this->assertDatabaseHas('inventory_stocks', [
            'product_id' => $this->product->id,
            'quantity' => 20,
            'average_cost' => 110000,
        ]);
    }

    public function test_project_usage_reduces_stock_and_keeps_average()
    {
        $this->asUser($this->warehouse);
        // seed stock
        $this->postJson('/api/v1/inventory/purchase-in', [
            'product_id' => $this->product->id,
            'quantity' => 20,
            'unit_cost' => 110000,
            'transaction_date' => now()->toDateTimeString(),
        ])->assertCreated();
        // usage
        $this->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->product->id,
            'project_id' => $this->projectActive->id,
            'quantity' => 5,
            'transaction_date' => now()->toDateTimeString(),
        ])->assertCreated();
        $this->assertDatabaseHas('inventory_stocks', [
            'product_id' => $this->product->id,
            'quantity' => 15,
            'average_cost' => 110000,
        ]);
    }

    public function test_stock_out_cannot_exceed_available_quantity()
    {
        $this->asUser($this->warehouse);
        // no stock yet
        $response = $this->postJson('/api/v1/inventory/stock-out', [
            'product_id' => $this->product->id,
            'quantity' => 5,
            'transaction_date' => now()->toDateTimeString(),
        ]);
        $response->assertStatus(400);
    }

    public function test_negative_quantity_is_rejected()
    {
        $this->asUser($this->warehouse);
        $response = $this->postJson('/api/v1/inventory/purchase-in', [
            'product_id' => $this->product->id,
            'quantity' => -5,
            'unit_cost' => 100000,
            'transaction_date' => now()->toDateTimeString(),
        ]);
        $response->assertStatus(422);
    }

    public function test_project_usage_requires_valid_project()
    {
        $this->asUser($this->warehouse);
        // missing project_id
        $response = $this->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'transaction_date' => now()->toDateTimeString(),
        ]);
        $response->assertStatus(422);
    }

    public function test_project_usage_cannot_use_cancelled_project()
    {
        $this->asUser($this->warehouse);
        // create stock first
        $this->postJson('/api/v1/inventory/purchase-in', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_cost' => 100000,
            'transaction_date' => now()->toDateTimeString(),
        ])->assertCreated();
        $response = $this->postJson('/api/v1/inventory/project-usage', [
            'product_id' => $this->product->id,
            'project_id' => $this->projectCancelled->id,
            'quantity' => 1,
            'transaction_date' => now()->toDateTimeString(),
        ]);
        $response->assertStatus(400);
    }

    public function test_movement_is_immutable_no_update_or_delete_routes()
    {
        $this->asUser($this->owner);
        $movementId = 1; // arbitrary, route does not exist
        $this->putJson('/api/v1/inventory/movements/' . $movementId, [])->assertNotFound();
        $this->deleteJson('/api/v1/inventory/movements/' . $movementId)->assertNotFound();
    }

    public function test_authorization_roles()
    {
        // Warehouse can create transaction
        $this->asUser($this->warehouse);
        $payload = [
            'product_id' => $this->product->id,
            'quantity' => 5,
            'unit_cost' => 100000,
            'transaction_date' => now()->toDateTimeString(),
        ];
        $this->postJson('/api/v1/inventory/purchase-in', $payload)->assertCreated();

        // Finance cannot create transaction
        $this->asUser($this->finance);
        $this->postJson('/api/v1/inventory/purchase-in', $payload)->assertStatus(403);

        // Owner can create transaction
        $this->asUser($this->owner);
        $this->postJson('/api/v1/inventory/purchase-in', $payload)->assertCreated();
    }

    public function test_stock_read_endpoints_are_accessible_to_all_roles()
    {
        // Seed some stock first
        $this->asUser($this->owner);
        $this->postJson('/api/v1/inventory/purchase-in', [
            'product_id' => $this->product->id,
            'quantity' => 5,
            'unit_cost' => 100000,
            'transaction_date' => now()->toDateTimeString(),
        ])->assertCreated();

        // Finance reads stock list
        $this->asUser($this->finance);
        $this->getJson('/api/v1/inventory/stocks')->assertOk();
        $this->getJson('/api/v1/inventory/stocks/' . $this->product->id)->assertOk();
        $this->getJson('/api/v1/inventory/products/' . $this->product->id . '/movements')->assertOk();
    }

    public function test_adjustment_out_boundary_cases()
    {
        $this->asUser($this->warehouse);
        // Seed initial stock of 10
        $this->postJson('/api/v1/inventory/purchase-in', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'unit_cost' => 10000,
            'transaction_date' => now()->toDateString(),
        ])->assertCreated();

        // Adjustment out 11 should be rejected (insufficient stock)
        $this->postJson('/api/v1/inventory/adjustment-out', [
            'product_id' => $this->product->id,
            'quantity' => 11,
            'transaction_date' => now()->toDateString(),
        ])->assertStatus(400);

        // Adjustment out 10 should be valid (stock becomes 0)
        $this->postJson('/api/v1/inventory/adjustment-out', [
            'product_id' => $this->product->id,
            'quantity' => 10,
            'transaction_date' => now()->toDateString(),
        ])->assertCreated();

        $this->assertDatabaseHas('inventory_stocks', [
            'product_id' => $this->product->id,
            'quantity' => 0,
        ]);

        // Adjustment out 1 when stock is 0 should be rejected
        $this->postJson('/api/v1/inventory/adjustment-out', [
            'product_id' => $this->product->id,
            'quantity' => 1,
            'transaction_date' => now()->toDateString(),
        ])->assertStatus(400);
    }
}
?>
