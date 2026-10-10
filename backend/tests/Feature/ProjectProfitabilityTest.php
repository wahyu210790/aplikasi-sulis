<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectExpense;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProjectProfitabilityTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function owner_and_finance_can_view_profitability_and_calculations_are_correct()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $finance = User::factory()->create(['role' => 'finance']);
        $warehouse = User::factory()->create(['role' => 'warehouse']);

        $project = Project::factory()->create([
            'revenue' => 10000000, // 10,000,000
        ]);

        // Create a PROJECT_USAGE inventory movement with total_cost 3,000,000
        $product = Product::factory()->create();
        \DB::table('inventory_movements')->insert([
            'product_id' => $product->id,
            'project_id' => $project->id,
            'type' => 'PROJECT_USAGE',
            'quantity' => 10,
            'unit_cost' => 300000,
            'total_cost' => 3000000,
            'transaction_date' => now()->toDateTimeString(),
            'created_by' => $owner->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create an expense of 1,000,000
        ProjectExpense::create([
            'project_id' => $project->id,
            'description' => 'Sample expense',
            'amount' => 1000000,
            'expense_date' => now()->toDateString(),
            'created_by' => $owner->id,
        ]);

        // Owner can view profitability
        Sanctum::actingAs($owner);
        $response = $this->getJson('/api/v1/projects/' . $project->id . '/profitability');
        $response->assertOk();
        $response->assertJsonFragment([
            'material_cost' => 3000000,
            'other_expenses' => 1000000,
            'total_cost' => 4000000,
            'gross_profit' => 6000000,
            'margin_percent' => 60,
        ]);

        // Finance can view profitability
        Sanctum::actingAs($finance);
        $response = $this->getJson('/api/v1/projects/' . $project->id . '/profitability');
        $response->assertOk();

        // Warehouse is forbidden
        Sanctum::actingAs($warehouse);
        $this->getJson('/api/v1/projects/' . $project->id . '/profitability')
            ->assertStatus(403);
    }

    /** @test */
    public function zero_revenue_does_not_cause_division_by_zero_and_margin_is_zero()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $project = Project::factory()->create(['revenue' => 0]);

        $product = Product::factory()->create();
        \DB::table('inventory_movements')->insert([
            'product_id' => $product->id,
            'project_id' => $project->id,
            'type' => 'PROJECT_USAGE',
            'quantity' => 1,
            'unit_cost' => 0,
            'total_cost' => 0,
            'transaction_date' => now()->toDateTimeString(),
            'created_by' => $owner->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        Sanctum::actingAs($owner);
        $response = $this->getJson('/api/v1/projects/' . $project->id . '/profitability');
        $response->assertOk();
        $response->assertJsonFragment(['margin_percent' => 0]);
    }

    /** @test */
    public function expense_crud_updates_total_cost_correctly()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $project = Project::factory()->create(['revenue' => 5000000]);

        Sanctum::actingAs($owner);
        // Store expense
        $store = $this->postJson('/api/v1/projects/' . $project->id . '/expenses', [
            'description' => 'Initial',
            'amount' => 200000,
            'expense_date' => now()->toDateString(),
        ]);
        $store->assertStatus(201);
        $expenseId = $store->json('id');

        // Verify total cost reflects expense (material cost 0)
        $profit = $this->getJson('/api/v1/projects/' . $project->id . '/profitability');
        $profit->assertJsonFragment(['total_cost' => 200000]);

        // Update expense
        $this->putJson('/api/v1/projects/' . $project->id . '/expenses/' . $expenseId, [
            'amount' => 500000,
        ])->assertOk();

        $profit = $this->getJson('/api/v1/projects/' . $project->id . '/profitability');
        $profit->assertJsonFragment(['total_cost' => 500000]);

        // Delete expense
        $this->deleteJson('/api/v1/projects/' . $project->id . '/expenses/' . $expenseId)
            ->assertStatus(204);
        $profit = $this->getJson('/api/v1/projects/' . $project->id . '/profitability');
        $profit->assertJsonFragment(['total_cost' => 0]);
    }
}
