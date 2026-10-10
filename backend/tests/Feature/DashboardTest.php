<?php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function owner_can_access_owner_dashboard()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        Sanctum::actingAs($owner);

        $response = $this->getJson('/api/v1/dashboard/owner');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'total_products',
            'total_quantity',
            'total_stock_value',
            'total_purchase_value',
            'total_revenue',
            'gross_profit',
            'overall_margin_percent',
            'recent_purchases',
            'recent_projects',
            'recent_stock_movements',
        ]);
    }

    /** @test */
    public function finance_can_access_finance_dashboard()
    {
        $finance = User::factory()->create(['role' => 'finance']);
        Sanctum::actingAs($finance);

        $response = $this->getJson('/api/v1/dashboard/finance');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'total_purchase_value',
            'total_revenue',
            'gross_profit',
            'overall_margin_percent',
            'recent_purchases',
            'recent_expenses',
            'recent_projects',
        ]);
    }

    /** @test */
    public function warehouse_can_access_warehouse_dashboard()
    {
        $warehouse = User::factory()->create(['role' => 'warehouse']);
        Sanctum::actingAs($warehouse);

        $response = $this->getJson('/api/v1/dashboard/warehouse');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'total_products',
            'total_quantity',
            'total_stock_value',
            'recent_stock_movements',
            'recent_stock_opnames',
        ]);
        // Ensure financial fields are absent
        $response->assertJsonMissing([
            'total_purchase_value',
            'total_revenue',
            'gross_profit',
        ]);
    }

    /** @test */
    public function cross_role_access_is_forbidden()
    {
        $owner = User::factory()->create(['role' => 'owner']);
        Sanctum::actingAs($owner);
        $this->getJson('/api/v1/dashboard/warehouse')->assertStatus(403);
        $this->getJson('/api/v1/dashboard/finance')->assertStatus(403);

        $warehouse = User::factory()->create(['role' => 'warehouse']);
        Sanctum::actingAs($warehouse);
        $this->getJson('/api/v1/dashboard/owner')->assertStatus(403);
        $this->getJson('/api/v1/dashboard/finance')->assertStatus(403);

        $finance = User::factory()->create(['role' => 'finance']);
        Sanctum::actingAs($finance);
        $this->getJson('/api/v1/dashboard/owner')->assertStatus(403);
        $this->getJson('/api/v1/dashboard/warehouse')->assertStatus(403);
    }
}
