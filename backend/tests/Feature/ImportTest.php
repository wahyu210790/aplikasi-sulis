<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockBalance;
use App\Models\Unit;
use App\Models\User;
use App\Support\AuditAction;
use App\Support\Xlsx;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsXlsxFiles;
use Tests\TestCase;

class ImportTest extends TestCase
{
    use BuildsXlsxFiles;
    use RefreshDatabase;

    private const HEADER = ['sku*', 'nama*', 'kategori*', 'satuan*', 'stok_minimum', 'catatan'];

    protected function setUp(): void
    {
        parent::setUp();
        Sanctum::actingAs(User::factory()->gudang()->create());
    }

    private function upload(array $rows, string $name = 'barang.xlsx')
    {
        return $this->post('/api/v1/imports/products', ['file' => $this->xlsxUpload($rows, $name)], ['Accept' => 'application/json']);
    }

    public function test_template_download_has_header_and_example_row(): void
    {
        $response = $this->get('/api/v1/imports/products/template', ['Accept' => 'application/json']);

        $response->assertOk();
        $this->assertSame('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('template-impor-barang.xlsx', $response->headers->get('Content-Disposition'));

        $rows = Xlsx::readFirstSheet($response->getFile()->getPathname());
        $this->assertSame(self::HEADER, $rows[1]);
        $this->assertSame('KBL-NYM-2X15', $rows[2][0]);
    }

    public function test_valid_file_creates_products_categories_and_units(): void
    {
        Category::factory()->create(['name' => 'Kabel']);
        Unit::factory()->create(['name' => 'meter', 'symbol' => 'm']);

        $this->upload([
            self::HEADER,
            ['kbl-001', 'Kabel NYA 1.5', 'KABEL', 'M', 50, 'Merk A'],
            ['PP-001', 'Pipa PVC', 'Pipa', 'Batang', '12,5', ''],
            ['PP-002', 'Pipa PVC 1"', 'pipa', 'batang', '', null],
        ])->assertOk()
            ->assertJsonPath('data.created', 3)
            ->assertJsonPath('data.updated', 0)
            ->assertJsonPath('data.skipped', 0)
            ->assertJsonPath('data.categories_created', ['Pipa'])
            ->assertJsonPath('data.units_created', ['Batang']);

        $this->assertSame(2, Category::count());
        $this->assertSame(2, Unit::count());
        $this->assertSame('batang', Unit::firstWhere('name', 'Batang')->symbol);
        $this->assertSame(3, StockBalance::count());

        $kabel = Product::firstWhere('sku', 'KBL-001');
        $this->assertSame('Kabel', $kabel->category->name);
        $this->assertSame('m', $kabel->unit->symbol);
        $this->assertSame('50.000', $kabel->min_stock);
        $this->assertSame('12.500', Product::firstWhere('sku', 'PP-001')->min_stock);
        $this->assertNull(Product::firstWhere('sku', 'PP-001')->notes);

        $this->assertSame(1, AuditLog::where('action', AuditAction::PRODUCT_IMPORTED)->count());
        $this->assertSame(0, AuditLog::where('action', AuditAction::PRODUCT_CREATED)->count());
    }

    public function test_existing_sku_is_updated_or_skipped_and_empty_rows_are_ignored(): void
    {
        $category = Category::factory()->create(['name' => 'Kabel']);
        $unit = Unit::factory()->create(['name' => 'meter', 'symbol' => 'm']);
        $same = Product::factory()->create(['sku' => 'KBL-001', 'name' => 'Kabel A', 'category_id' => $category->id, 'unit_id' => $unit->id, 'min_stock' => '10']);
        $changed = Product::factory()->inactive()->create(['sku' => 'KBL-002', 'name' => 'Kabel B', 'category_id' => $category->id, 'unit_id' => $unit->id]);

        $this->upload([
            self::HEADER,
            ['KBL-001', 'Kabel A', 'Kabel', 'meter', '10', ''],
            ['', '', '', '', '', ''],
            ['kbl-002', 'Kabel B Baru', 'Kabel', 'meter', '5', 'catatan baru'],
        ])->assertOk()
            ->assertJsonPath('data.created', 0)
            ->assertJsonPath('data.updated', 1)
            ->assertJsonPath('data.skipped', 1);

        $changed->refresh();
        $this->assertSame('Kabel B Baru', $changed->name);
        $this->assertSame('5.000', $changed->min_stock);
        $this->assertFalse($changed->is_active, 'import must not re-activate a product');
        $this->assertSame('Kabel A', $same->fresh()->name);
    }

    public function test_invalid_rows_save_nothing_and_list_every_error(): void
    {
        Category::factory()->inactive()->create(['name' => 'Lama']);

        // Row numbers are Excel row numbers: row 3 is empty, so the bad rows are 4 and 5.
        $response = $this->upload([
            self::HEADER,
            ['KBL-001', 'Kabel A', 'Kabel Baru', 'meter', '10', ''],
            [],
            ['KBL 002', 'B', '', 'meter', 'abc', ''],
            ['kbl-001', 'Kabel C', 'Lama', '', '', ''],
        ]);

        $response->assertUnprocessable()
            ->assertJsonPath('message', 'Ada 7 kesalahan di file. Tidak ada data yang disimpan. Perbaiki file lalu unggah lagi.')
            ->assertJsonPath('error_count', 7)
            ->assertJsonCount(7, 'errors')
            ->assertJsonPath('errors.0', ['row' => 4, 'column' => 'sku', 'message' => 'SKU hanya boleh berisi huruf, angka, dan tanda - . _ /'])
            ->assertJsonPath('errors.1', ['row' => 4, 'column' => 'nama', 'message' => 'Nama harus 2 sampai 150 karakter.'])
            ->assertJsonPath('errors.2', ['row' => 4, 'column' => 'kategori', 'message' => 'Kategori wajib diisi.'])
            ->assertJsonPath('errors.3', ['row' => 4, 'column' => 'stok_minimum', 'message' => 'Stok minimum harus angka 0 atau lebih, maksimal 3 angka di belakang koma.'])
            ->assertJsonPath('errors.4', ['row' => 5, 'column' => 'sku', 'message' => 'SKU KBL-001 sudah ada di baris 2.'])
            ->assertJsonPath('errors.5', ['row' => 5, 'column' => 'kategori', 'message' => 'Kategori "Lama" sudah nonaktif.'])
            ->assertJsonPath('errors.6', ['row' => 5, 'column' => 'satuan', 'message' => 'Satuan wajib diisi.']);

        $this->assertSame(0, Product::count());
        $this->assertSame(1, Category::count(), 'no category may be created when the import fails');
        $this->assertSame(0, Unit::count());
        $this->assertSame(0, AuditLog::where('action', AuditAction::PRODUCT_IMPORTED)->count());
    }

    public function test_errors_are_capped_at_100_but_counted(): void
    {
        $rows = [self::HEADER];
        for ($i = 1; $i <= 120; $i++) {
            $rows[] = ["BAD SKU {$i}", 'Barang', 'Kabel', 'meter', '', ''];
        }

        $this->upload($rows)
            ->assertUnprocessable()
            ->assertJsonPath('error_count', 120)
            ->assertJsonCount(100, 'errors');
    }

    public function test_missing_required_column_is_reported(): void
    {
        $this->upload([
            ['sku', 'nama', 'satuan'],
            ['KBL-001', 'Kabel A', 'meter'],
        ])->assertUnprocessable()
            ->assertJsonPath('errors.0', ['row' => 1, 'column' => 'kategori', 'message' => 'Kolom "kategori" tidak ditemukan di baris judul. Gunakan template dari tombol "Unduh Template".']);
    }

    public function test_file_type_size_and_row_limits(): void
    {
        $this->post('/api/v1/imports/products', [], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'File wajib diisi.');

        $this->post('/api/v1/imports/products', ['file' => UploadedFile::fake()->create('barang.csv', 10, 'text/csv')], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'File harus berupa file dengan ekstensi: xlsx.');

        $this->post('/api/v1/imports/products', ['file' => UploadedFile::fake()->create('besar.xlsx', 3000)], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Ukuran file maksimal 2048 kilobyte.');

        $this->post('/api/v1/imports/products', ['file' => UploadedFile::fake()->createWithContent('rusak.xlsx', 'ini bukan excel')], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'File tidak bisa dibaca. Pastikan file berformat .xlsx (Excel).');

        $this->upload([self::HEADER])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'File tidak berisi data barang.');

        $rows = [self::HEADER];
        for ($i = 1; $i <= 2001; $i++) {
            $rows[] = ["BRG-{$i}", "Barang {$i}", 'Kabel', 'meter', '', ''];
        }
        $this->upload($rows)
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Maksimal 2.000 baris data per file. Pecah file menjadi beberapa bagian.');

        $this->assertSame(0, Product::count());
    }

    public function test_finance_cannot_import(): void
    {
        Sanctum::actingAs(User::factory()->finance()->create());

        $this->get('/api/v1/imports/products/template', ['Accept' => 'application/json'])->assertForbidden();
        $this->upload([self::HEADER, ['KBL-001', 'Kabel A', 'Kabel', 'meter', '', '']])->assertForbidden();
        $this->assertSame(0, Product::count());
    }
}
