<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockBalance;
use App\Models\Unit;
use App\Models\User;
use App\Support\AuditAction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    private Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->owner()->create());
        $this->category = Category::factory()->create(['name' => 'Kabel']);
        $this->unit = Unit::factory()->create(['name' => 'meter', 'symbol' => 'm']);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'sku' => 'kbl-nym-2x15',
            'name' => 'Kabel NYM 2x1.5',
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'min_stock' => '50',
            'notes' => 'Merk Supreme',
        ], $overrides);
    }

    public function test_create_product_also_creates_empty_stock_balance(): void
    {
        $this->postJson('/api/v1/products', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.sku', 'KBL-NYM-2X15')
            ->assertJsonPath('data.category.name', 'Kabel')
            ->assertJsonPath('data.unit.symbol', 'm')
            ->assertJsonPath('data.min_stock', '50.000')
            ->assertJsonPath('data.is_active', true)
            ->assertJsonPath('data.stock.qty', '0.000')
            ->assertJsonPath('data.stock.avg_cost', '0.0000')
            ->assertJsonPath('data.stock.stock_value', 0)
            ->assertJsonPath('data.stock.has_cost', false);

        $product = Product::firstWhere('sku', 'KBL-NYM-2X15');
        $this->assertSame(1, StockBalance::where('product_id', $product->id)->count());
        $this->assertSame(1, AuditLog::where('action', AuditAction::PRODUCT_CREATED)->where('subject_id', $product->id)->count());
    }

    public function test_sku_format_and_uniqueness(): void
    {
        Product::factory()->create(['sku' => 'KBL-001']);

        $this->postJson('/api/v1/products', $this->payload(['sku' => 'kbl-001']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'SKU sudah digunakan.');

        $this->postJson('/api/v1/products', $this->payload(['sku' => 'KBL 001']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'SKU hanya boleh berisi huruf, angka, dan tanda - . _ /');

        $this->postJson('/api/v1/products', $this->payload(['min_stock' => '1.2345']))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Format stok minimum tidak valid.');
    }

    public function test_inactive_category_or_unit_is_rejected_on_create(): void
    {
        $oldCategory = Category::factory()->inactive()->create();
        $oldUnit = Unit::factory()->inactive()->create();

        $this->postJson('/api/v1/products', $this->payload(['category_id' => $oldCategory->id]))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Kategori tidak ditemukan atau sudah nonaktif.');

        $this->postJson('/api/v1/products', $this->payload(['unit_id' => $oldUnit->id]))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Satuan tidak ditemukan atau sudah nonaktif.');
    }

    public function test_update_product_writes_audit_log(): void
    {
        $product = Product::factory()->create(['sku' => 'KBL-001', 'category_id' => $this->category->id, 'unit_id' => $this->unit->id]);
        // The current category became inactive: saving the product with it must still work.
        $this->category->update(['is_active' => false]);

        $this->putJson("/api/v1/products/{$product->id}", $this->payload(['sku' => 'KBL-001', 'name' => 'Kabel Baru', 'is_active' => false]))
            ->assertOk()
            ->assertJsonPath('data.name', 'Kabel Baru')
            ->assertJsonPath('data.is_active', false);

        $log = AuditLog::where('action', AuditAction::PRODUCT_UPDATED)->first();
        $this->assertNotNull($log);
        $this->assertSame('Kabel Baru', $log->changes['after']['name']);
        $this->assertFalse($log->changes['after']['is_active']);

        $other = Category::factory()->inactive()->create();
        $this->putJson("/api/v1/products/{$product->id}", $this->payload(['sku' => 'KBL-001', 'category_id' => $other->id, 'is_active' => true]))
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Kategori tidak ditemukan atau sudah nonaktif.');
    }

    public function test_list_filters_and_sort(): void
    {
        $pipa = Category::factory()->create(['name' => 'Pipa']);
        Product::factory()->create(['sku' => 'KBL-001', 'name' => 'Kabel NYA', 'category_id' => $this->category->id]);
        Product::factory()->create(['sku' => 'PP-001', 'name' => 'Pipa PVC', 'category_id' => $pipa->id]);
        Product::factory()->inactive()->create(['sku' => 'LMP-001', 'name' => 'Lampu Lama']);

        $this->getJson('/api/v1/products')
            ->assertOk()
            ->assertJsonCount(3, 'data')
            ->assertJsonPath('data.0.name', 'Kabel NYA')
            ->assertJsonPath('meta.total', 3);

        $this->getJson('/api/v1/products?search=pp-0')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.sku', 'PP-001');
        $this->getJson('/api/v1/products?search=kabel')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/v1/products?category_id={$pipa->id}")->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/products?is_active=0')->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.sku', 'LMP-001');
        $this->getJson('/api/v1/products?sort=sku&direction=desc')->assertOk()->assertJsonPath('data.0.sku', 'PP-001');
        $this->getJson('/api/v1/products?sort=price')->assertUnprocessable();
    }

    public function test_low_stock_filter_and_flag(): void
    {
        $low = Product::factory()->create(['sku' => 'A-1', 'name' => 'A', 'min_stock' => '10']);
        $low->stockBalance->update(['qty' => '10']);
        $ok = Product::factory()->create(['sku' => 'B-1', 'name' => 'B', 'min_stock' => '10']);
        $ok->stockBalance->update(['qty' => '10.001']);
        // min_stock 0 means "no threshold": never low, even with qty 0.
        Product::factory()->create(['sku' => 'C-1', 'name' => 'C', 'min_stock' => '0']);

        $this->getJson('/api/v1/products?low_stock=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.sku', 'A-1')
            ->assertJsonPath('data.0.is_low_stock', true);

        $this->getJson('/api/v1/products')
            ->assertJsonPath('data.1.is_low_stock', false)
            ->assertJsonPath('data.2.is_low_stock', false);
    }

    public function test_show_product_for_owner_includes_money(): void
    {
        $product = Product::factory()->create();
        $product->stockBalance->update(['qty' => '115', 'avg_cost' => '11500', 'stock_value' => 1322500, 'has_cost' => true]);

        $this->getJson("/api/v1/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.stock.qty', '115.000')
            ->assertJsonPath('data.stock.avg_cost', '11500.0000')
            ->assertJsonPath('data.stock.stock_value', 1322500)
            ->assertJsonPath('data.stock.has_cost', true);

        $this->getJson('/api/v1/products/999')->assertNotFound()->assertJsonPath('message', 'Data tidak ditemukan.');
    }

    public function test_finance_can_view_but_not_create_or_update(): void
    {
        $product = Product::factory()->create();
        Sanctum::actingAs(User::factory()->finance()->create());

        $this->getJson('/api/v1/products')->assertOk();
        $this->getJson("/api/v1/products/{$product->id}")->assertOk()->assertJsonPath('data.stock.has_cost', false);
        $this->postJson('/api/v1/products', $this->payload())->assertForbidden();
        $this->putJson("/api/v1/products/{$product->id}", $this->payload(['is_active' => true]))->assertForbidden();
    }
}
