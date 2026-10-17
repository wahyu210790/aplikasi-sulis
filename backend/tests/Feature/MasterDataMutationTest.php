<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Category;
use App\Models\Unit;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Project;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests untuk mutasi master data:
 *  - Produk (owner & warehouse boleh, finance 403)
 *  - Kategori (owner & warehouse boleh, finance 403)
 *  - Supplier (owner & finance boleh, warehouse 403)
 *  - Project (owner & finance boleh, warehouse 403)
 *
 * Meliputi: create berhasil, validasi gagal, duplikat, dan penolakan akses.
 */
class MasterDataMutationTest extends TestCase
{
    use RefreshDatabase;

    protected User $owner;
    protected User $warehouse;
    protected User $finance;

    protected function setUp(): void
    {
        parent::setUp();
        $this->owner     = User::factory()->create(['role' => 'owner']);
        $this->warehouse = User::factory()->create(['role' => 'warehouse']);
        $this->finance   = User::factory()->create(['role' => 'finance']);
    }

    // =========================================================================
    // PRODUK
    // =========================================================================

    public function test_owner_can_create_product()
    {
        $category = Category::factory()->create();
        $unit     = Unit::factory()->create();

        $response = $this->actingAs($this->owner)->postJson('/api/v1/products', [
            'name'        => 'Baut M12',
            'code'        => 'PRD-BM12',
            'category_id' => $category->id,
            'unit_id'     => $unit->id,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('name', 'Baut M12');
        $response->assertJsonPath('code', 'PRD-BM12');
        $this->assertDatabaseHas('products', ['code' => 'PRD-BM12']);
    }

    public function test_warehouse_can_create_product()
    {
        $category = Category::factory()->create();
        $unit     = Unit::factory()->create();

        $response = $this->actingAs($this->warehouse)->postJson('/api/v1/products', [
            'name'        => 'Mur Besi 10mm',
            'code'        => 'PRD-MB10',
            'category_id' => $category->id,
            'unit_id'     => $unit->id,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('products', ['code' => 'PRD-MB10']);
    }

    public function test_finance_cannot_create_product()
    {
        $category = Category::factory()->create();
        $unit     = Unit::factory()->create();

        $response = $this->actingAs($this->finance)->postJson('/api/v1/products', [
            'name'        => 'Kabel NYA 2.5mm',
            'code'        => 'PRD-KBL',
            'category_id' => $category->id,
            'unit_id'     => $unit->id,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('products', ['code' => 'PRD-KBL']);
    }

    public function test_product_creation_fails_validation_without_required_fields()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/products', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name', 'code', 'category_id', 'unit_id']);
    }

    public function test_product_creation_fails_with_duplicate_code()
    {
        $category = Category::factory()->create();
        $unit     = Unit::factory()->create();

        Product::factory()->create(['code' => 'DUP-001', 'category_id' => $category->id, 'unit_id' => $unit->id]);

        $response = $this->actingAs($this->owner)->postJson('/api/v1/products', [
            'name'        => 'Another Product',
            'code'        => 'DUP-001',
            'category_id' => $category->id,
            'unit_id'     => $unit->id,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['code']);
    }

    public function test_product_creation_fails_with_invalid_category_id()
    {
        $unit = Unit::factory()->create();

        $response = $this->actingAs($this->owner)->postJson('/api/v1/products', [
            'name'        => 'Test Product',
            'code'        => 'PRD-TST',
            'category_id' => 999999,
            'unit_id'     => $unit->id,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['category_id']);
    }

    public function test_unauthenticated_cannot_create_product()
    {
        $response = $this->postJson('/api/v1/products', [
            'name' => 'Test',
            'code' => 'TST-001',
        ]);

        $response->assertUnauthorized();
    }

    // =========================================================================
    // KATEGORI
    // =========================================================================

    public function test_owner_can_create_category()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/categories', [
            'name' => 'Material Bangunan',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('name', 'Material Bangunan');
        // Kode harus di-generate otomatis
        $this->assertNotEmpty($response->json('code'));
        $this->assertDatabaseHas('categories', ['name' => 'Material Bangunan']);
    }

    public function test_warehouse_can_create_category()
    {
        $response = $this->actingAs($this->warehouse)->postJson('/api/v1/categories', [
            'name'        => 'Material Elektrikal',
            'description' => 'Kabel, saklar, dan komponen listrik',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('categories', ['name' => 'Material Elektrikal']);
    }

    public function test_finance_cannot_create_category()
    {
        $response = $this->actingAs($this->finance)->postJson('/api/v1/categories', [
            'name' => 'Alat Ukur',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('categories', ['name' => 'Alat Ukur']);
    }

    public function test_category_creation_auto_generates_unique_code()
    {
        $response1 = $this->actingAs($this->owner)->postJson('/api/v1/categories', [
            'name' => 'Cat Alpha',
        ]);
        $response2 = $this->actingAs($this->owner)->postJson('/api/v1/categories', [
            'name' => 'Cat Beta',
        ]);

        $response1->assertCreated();
        $response2->assertCreated();

        $code1 = $response1->json('code');
        $code2 = $response2->json('code');

        $this->assertNotEmpty($code1);
        $this->assertNotEmpty($code2);
        $this->assertNotEquals($code1, $code2);
    }

    public function test_category_creation_accepts_explicit_code()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/categories', [
            'name' => 'Material Mekanik',
            'code' => 'MAT-MEK',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('code', 'MAT-MEK');
    }

    public function test_category_creation_fails_with_duplicate_name()
    {
        Category::factory()->create(['name' => 'Existing Category', 'code' => 'EX-001']);

        $response = $this->actingAs($this->owner)->postJson('/api/v1/categories', [
            'name' => 'Existing Category',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_category_creation_fails_with_duplicate_explicit_code()
    {
        Category::factory()->create(['name' => 'First Category', 'code' => 'DUPCAT-01']);

        $response = $this->actingAs($this->owner)->postJson('/api/v1/categories', [
            'name' => 'Second Category',
            'code' => 'DUPCAT-01',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['code']);
    }

    public function test_category_creation_fails_without_name()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/categories', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name']);
    }

    // =========================================================================
    // SUPPLIER
    // =========================================================================

    public function test_owner_can_create_supplier()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/suppliers', [
            'name'  => 'PT Mandiri Jaya',
            'phone' => '0812-3456-7890',
            'email' => 'info@mandiri.com',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('name', 'PT Mandiri Jaya');
        // Kode harus di-generate otomatis
        $this->assertNotEmpty($response->json('code'));
        $this->assertDatabaseHas('suppliers', ['name' => 'PT Mandiri Jaya']);
    }

    public function test_finance_can_create_supplier()
    {
        $response = $this->actingAs($this->finance)->postJson('/api/v1/suppliers', [
            'name' => 'CV Berkah Abadi',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('suppliers', ['name' => 'CV Berkah Abadi']);
    }

    public function test_warehouse_cannot_create_supplier()
    {
        $response = $this->actingAs($this->warehouse)->postJson('/api/v1/suppliers', [
            'name' => 'PT Sumber Tani',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('suppliers', ['name' => 'PT Sumber Tani']);
    }

    public function test_supplier_creation_fails_without_name()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/suppliers', []);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_supplier_creation_fails_with_duplicate_explicit_code()
    {
        Supplier::create(['name' => 'Supplier A', 'code' => 'SUP-DUP01']);

        $response = $this->actingAs($this->owner)->postJson('/api/v1/suppliers', [
            'name' => 'Supplier B',
            'code' => 'SUP-DUP01',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['code']);
    }

    public function test_supplier_creation_auto_generates_unique_codes()
    {
        $r1 = $this->actingAs($this->owner)->postJson('/api/v1/suppliers', ['name' => 'Sup Alpha']);
        $r2 = $this->actingAs($this->finance)->postJson('/api/v1/suppliers', ['name' => 'Sup Beta']);

        $r1->assertCreated();
        $r2->assertCreated();

        $this->assertNotEquals($r1->json('code'), $r2->json('code'));
    }

    public function test_supplier_accepts_explicit_code()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/suppliers', [
            'name' => 'PT Explicit Code',
            'code' => 'SUP-EXPLICIT',
        ]);

        $response->assertCreated();
        $response->assertJsonPath('code', 'SUP-EXPLICIT');
    }

    public function test_supplier_creation_fails_invalid_email()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/suppliers', [
            'name'  => 'PT Bad Email',
            'email' => 'not-an-email',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['email']);
    }

    // =========================================================================
    // PROJECT
    // =========================================================================

    public function test_owner_can_create_project()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'name'    => 'Proyek Gedung Baru',
            'revenue' => 500000000,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('name', 'Proyek Gedung Baru');
        // Kode harus di-generate otomatis
        $this->assertNotEmpty($response->json('code'));
        $this->assertDatabaseHas('projects', ['name' => 'Proyek Gedung Baru']);
    }

    public function test_finance_can_create_project()
    {
        $response = $this->actingAs($this->finance)->postJson('/api/v1/projects', [
            'name'    => 'Proyek Jembatan X',
            'revenue' => 1000000000,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('projects', ['name' => 'Proyek Jembatan X']);
    }

    public function test_warehouse_cannot_create_project()
    {
        $response = $this->actingAs($this->warehouse)->postJson('/api/v1/projects', [
            'name'    => 'Proyek Rahasia',
            'revenue' => 100000,
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('projects', ['name' => 'Proyek Rahasia']);
    }

    public function test_project_creation_auto_generates_unique_code()
    {
        $r1 = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'name'    => 'Project Alpha',
            'revenue' => 1000000,
        ]);
        $r2 = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'name'    => 'Project Beta',
            'revenue' => 2000000,
        ]);

        $r1->assertCreated();
        $r2->assertCreated();

        $code1 = $r1->json('code');
        $code2 = $r2->json('code');

        $this->assertNotEmpty($code1);
        $this->assertNotEmpty($code2);
        $this->assertNotEquals($code1, $code2);
    }

    public function test_project_creation_accepts_explicit_code()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'name'    => 'Proyek Custom Code',
            'code'    => 'PRJ-CUSTOM',
            'revenue' => 500000,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('code', 'PRJ-CUSTOM');
    }

    public function test_project_creation_defaults_status_to_draft()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'name'    => 'Proyek Default Status',
            'revenue' => 500000,
        ]);

        $response->assertCreated();
        $response->assertJsonPath('status', 'draft');
    }

    public function test_project_creation_fails_without_name()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'revenue' => 500000,
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['name']);
    }

    public function test_project_creation_fails_with_duplicate_explicit_code()
    {
        Project::factory()->create(['code' => 'PRJ-DUP001', 'name' => 'First Project']);

        $response = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'name' => 'Second Project',
            'code' => 'PRJ-DUP001',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['code']);
    }

    public function test_project_creation_fails_with_invalid_status()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/v1/projects', [
            'name'   => 'Proyek Invalid Status',
            'status' => 'UNKNOWN_STATUS',
        ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['status']);
    }

    public function test_warehouse_cannot_read_projects()
    {
        $response = $this->actingAs($this->warehouse)->getJson('/api/v1/projects');

        $response->assertForbidden();
    }
}
