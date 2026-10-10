<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Project;
use Laravel\Sanctum\Sanctum;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('db:seed');
        Project::factory()->create(['id' => 1]);
    }

    /** @test */
    public function owner_can_access_all_reports()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        Sanctum::actingAs($owner);

        $endpoints = [
            'inventory-summary',
            'stock-movements',
            'purchase-summary',
            'project-profitability',
            'financial-overview',
            'projects/1/cost-detail', // assuming at least one project exists via seed
        ];

        foreach ($endpoints as $endpoint) {
            $response = $this->getJson('/api/v1/reports/' . $endpoint);
            $response->assertStatus(200);
        }
    }

    /** @test */
    public function finance_can_access_allowed_reports_and_forbidden_others()
    {
        $finance = User::factory()->create(['role' => 'finance']);
        Sanctum::actingAs($finance);

        $allowed = [
            'stock-movements',
            'purchase-summary',
            'project-profitability',
            'financial-overview',
            'projects/1/cost-detail',
        ];
        $forbidden = [
            'inventory-summary',
        ];

        foreach ($allowed as $endpoint) {
            $response = $this->getJson('/api/v1/reports/' . $endpoint);
            $response->assertStatus(200);
        }
        foreach ($forbidden as $endpoint) {
            $response = $this->getJson('/api/v1/reports/' . $endpoint);
            $response->assertStatus(403);
        }
    }

    /** @test */
    public function warehouse_can_access_inventory_and_stock_movements_and_is_forbidden_from_financial_reports()
    {
        $warehouse = User::factory()->create(['role' => 'warehouse']);
        Sanctum::actingAs($warehouse);

        $allowed = [
            'inventory-summary',
            'stock-movements',
        ];
        $forbidden = [
            'purchase-summary',
            'project-profitability',
            'financial-overview',
            'projects/1/cost-detail',
        ];

        foreach ($allowed as $endpoint) {
            $response = $this->getJson('/api/v1/reports/' . $endpoint);
            $response->assertStatus(200);
        }
        foreach ($forbidden as $endpoint) {
            $response = $this->getJson('/api/v1/reports/' . $endpoint);
            $response->assertStatus(403);
        }
    }

    /** @test */
    public function inventory_summary_returns_correct_structure()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        Sanctum::actingAs($owner);
        $response = $this->getJson('/api/v1/reports/inventory-summary');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'total_products',
                'total_quantity',
                'total_value',
                'zero_stock',
                'low_stock',
            ]);
    }

    /** @test */
    public function stock_movements_pagination_works()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        Sanctum::actingAs($owner);
        $response = $this->getJson('/api/v1/reports/stock-movements?per_page=5');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'current_page',
                'last_page',
                'per_page',
                'total',
                'data',
            ]);
    }
}
?>
