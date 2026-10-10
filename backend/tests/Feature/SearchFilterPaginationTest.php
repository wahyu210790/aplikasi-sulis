<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Project;
use App\Models\InventoryStock;
use App\Models\Purchase;
use App\Models\StockOpname;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchFilterPaginationTest extends TestCase
{
    use RefreshDatabase;

    protected $owner;
    protected $warehouse;
    protected $finance;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner = User::factory()->create(['role' => 'owner']);
        $this->warehouse = User::factory()->create(['role' => 'warehouse']);
        $this->finance = User::factory()->create(['role' => 'finance']);
    }

    public function test_products_search_filter_sort_pagination()
    {
        $cat1 = Category::factory()->create(['name' => 'Elektronik']);
        $cat2 = Category::factory()->create(['name' => 'Bangunan']);

        Product::factory()->create(['name' => 'Semen Gresik', 'code' => 'SMN-01', 'category_id' => $cat2->id]);
        Product::factory()->create(['name' => 'Kabel Listrik', 'code' => 'KBL-01', 'category_id' => $cat1->id]);
        Product::factory()->create(['name' => 'Paku Beton', 'code' => 'PKU-01', 'category_id' => $cat2->id]);

        // Search
        $response = $this->actingAs($this->owner)->getJson('/api/v1/products?search=Semen');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('Semen Gresik', $response->json('data.0.name'));

        // Category filter
        $response = $this->actingAs($this->owner)->getJson('/api/v1/products?category_id=' . $cat1->id);
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('Kabel Listrik', $response->json('data.0.name'));

        // Sorting & Pagination
        $response = $this->actingAs($this->owner)->getJson('/api/v1/products?sort=name&direction=desc&per_page=2');
        $response->assertOk();
        $this->assertEquals(2, count($response->json('data')));
        $this->assertEquals('Semen Gresik', $response->json('data.0.name'));
        $this->assertEquals(3, $response->json('total'));
        $this->assertEquals(2, $response->json('last_page'));
    }

    public function test_categories_search_sort_pagination()
    {
        Category::factory()->create(['name' => 'Alpha']);
        Category::factory()->create(['name' => 'Beta']);
        Category::factory()->create(['name' => 'Gamma']);

        $response = $this->actingAs($this->owner)->getJson('/api/v1/categories?search=Bet');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('Beta', $response->json('data.0.name'));
    }

    public function test_suppliers_search_sort_pagination()
    {
        Supplier::create(['name' => 'PT Jaya Abadi', 'code' => 'SUP-01']);
        Supplier::create(['name' => 'CV Sumber Makmur', 'code' => 'SUP-02']);

        $response = $this->actingAs($this->owner)->getJson('/api/v1/suppliers?search=Jaya');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('PT Jaya Abadi', $response->json('data.0.name'));
    }

    public function test_projects_search_status_pagination()
    {
        Project::factory()->create(['name' => 'Proyek Gedung A', 'code' => 'PRJ-01', 'status' => 'active', 'revenue' => 10000000]);
        Project::factory()->create(['name' => 'Proyek Jembatan B', 'code' => 'PRJ-02', 'status' => 'completed', 'revenue' => 50000000]);

        $response = $this->actingAs($this->owner)->getJson('/api/v1/projects?search=Gedung');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('Proyek Gedung A', $response->json('data.0.name'));

        // Status filter
        $response = $this->actingAs($this->finance)->getJson('/api/v1/projects?status=completed');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('Proyek Jembatan B', $response->json('data.0.name'));

        // Warehouse is forbidden
        $this->actingAs($this->warehouse)->getJson('/api/v1/projects')->assertForbidden();
    }

    public function test_inventory_stocks_search_low_stock()
    {
        $cat = Category::factory()->create();
        $p1 = Product::factory()->create(['name' => 'Lampu LED', 'code' => 'LMP-01', 'category_id' => $cat->id]);
        $p2 = Product::factory()->create(['name' => 'Saklar Listrik', 'code' => 'SKL-01', 'category_id' => $cat->id]);

        InventoryStock::create(['product_id' => $p1->id, 'quantity' => 2, 'average_cost' => 10000, 'total_value' => 20000]);
        InventoryStock::create(['product_id' => $p2->id, 'quantity' => 100, 'average_cost' => 5000, 'total_value' => 500000]);

        // Search
        $response = $this->actingAs($this->owner)->getJson('/api/v1/inventory/stocks?search=Lampu');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));

        // Low stock (quantity <= 5)
        $response = $this->actingAs($this->warehouse)->getJson('/api/v1/inventory/stocks?low_stock=1');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('Lampu LED', $response->json('data.0.product.name'));
    }

    public function test_purchases_search_status_date_range()
    {
        $sup = Supplier::create(['name' => 'PT Mitra', 'code' => 'SUP-MTR']);
        Purchase::create([
            'supplier_id' => $sup->id,
            'purchase_number' => 'PUR-1001',
            'purchase_date' => '2026-01-10',
            'status' => 'DRAFT',
            'total_amount' => 100000,
            'created_by' => $this->owner->id,
        ]);
        Purchase::create([
            'supplier_id' => $sup->id,
            'purchase_number' => 'PUR-1002',
            'purchase_date' => '2026-02-15',
            'status' => 'CONFIRMED',
            'total_amount' => 500000,
            'created_by' => $this->owner->id,
        ]);

        // Search
        $response = $this->actingAs($this->finance)->getJson('/api/v1/purchases?search=PUR-1001');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));

        // Date range
        $response = $this->actingAs($this->finance)->getJson('/api/v1/purchases?date_from=2026-02-01&date_to=2026-02-28');
        $response->assertOk();
        $this->assertEquals(1, count($response->json('data')));
        $this->assertEquals('PUR-1002', $response->json('data.0.purchase_number'));
    }
}
