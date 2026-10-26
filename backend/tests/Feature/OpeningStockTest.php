<?php

namespace Tests\Feature;

use App\Enums\MovementType;
use App\Models\AuditLog;
use App\Models\Product;
use App\Models\StockBalance;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use App\Support\AuditAction;
use App\Support\Xlsx;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\BuildsXlsxFiles;
use Tests\TestCase;

/** docs/desain-v2.md B5.6 (manual) and B5.7 (Excel import). Owner and Finance only. */
class OpeningStockTest extends TestCase
{
    use BuildsXlsxFiles;
    use RefreshDatabase;

    private const HEADER = ['sku*', 'jumlah*', 'harga_modal*', 'tanggal'];

    private Product $cable;

    private Product $pipe;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        Sanctum::actingAs(User::factory()->owner()->create());
        $meter = Unit::factory()->create(['symbol' => 'mtr']);
        $this->cable = Product::factory()->create(['sku' => 'KBL-001', 'name' => 'Kabel NYM', 'unit_id' => $meter->id]);
        $this->pipe = Product::factory()->create(['sku' => 'PPA-001', 'name' => 'Pipa PVC']);
    }

    private function upload(array $rows)
    {
        return $this->post('/api/v1/imports/opening-stocks', ['file' => $this->xlsxUpload($rows, 'stok-awal.xlsx')], ['Accept' => 'application/json']);
    }

    public function test_owner_enters_opening_stock_and_balances_are_set(): void
    {
        $response = $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-01',
            'items' => [
                ['product_id' => $this->pipe->id, 'qty' => '2.5', 'unit_cost' => 1001],
                ['product_id' => $this->cable->id, 'qty' => 100, 'unit_cost' => 10000],
            ],
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.0.type', 'opening')
            ->assertJsonPath('data.0.type_label', 'Stok Awal')
            ->assertJsonPath('data.0.product.sku', 'KBL-001')
            ->assertJsonPath('data.0.product.unit_symbol', 'mtr')
            ->assertJsonPath('data.0.qty_change', '100.000')
            ->assertJsonPath('data.0.value_change', 1000000)
            ->assertJsonPath('data.0.movement_date', '2026-10-01')
            ->assertJsonPath('data.1.product.sku', 'PPA-001')
            ->assertJsonPath('data.1.value_change', 2503)
            ->assertJsonPath('data.1.unit_cost', '1001.2000');

        $balance = StockBalance::where('product_id', $this->cable->id)->first();
        $this->assertSame(['100.000', 1000000, '10000.0000', true], [$balance->qty, $balance->stock_value, $balance->avg_cost, $balance->has_cost]);
        $log = AuditLog::where('action', AuditAction::OPENING_STOCK_CREATED)->sole();
        $this->assertSame('Stok awal 2 barang tanggal 2026-10-01', $log->summary);
        $this->assertSame('KBL-001', $log->changes['after']['items'][0]['sku']);
    }

    public function test_finance_may_enter_opening_stock_gudang_may_not(): void
    {
        $body = ['movement_date' => '2026-10-27', 'items' => [['product_id' => $this->cable->id, 'qty' => '1', 'unit_cost' => 0]]];

        Sanctum::actingAs(User::factory()->gudang()->create());
        $this->postJson('/api/v1/opening-stocks', $body)->assertForbidden();
        $this->getJson('/api/v1/imports/opening-stocks/template')->assertForbidden();

        Sanctum::actingAs(User::factory()->finance()->create());
        $this->postJson('/api/v1/opening-stocks', $body)->assertCreated();
        $this->assertSame(1, StockMovement::count());
    }

    public function test_product_that_already_has_movements_rejects_the_whole_request(): void
    {
        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-27',
            'items' => [['product_id' => $this->cable->id, 'qty' => '5', 'unit_cost' => 100]],
        ])->assertCreated();

        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-27',
            'items' => [
                ['product_id' => $this->pipe->id, 'qty' => '5', 'unit_cost' => 100],
                ['product_id' => $this->cable->id, 'qty' => '5', 'unit_cost' => 100],
            ],
        ])->assertStatus(422)
            ->assertExactJson(['message' => 'Stok awal KBL-001 sudah pernah diisi atau barang sudah punya transaksi.']);

        $this->assertSame(0, StockMovement::where('product_id', $this->pipe->id)->count());
        $this->assertSame('0.000', StockBalance::where('product_id', $this->pipe->id)->value('qty'));
    }

    public function test_validation_messages_are_indonesian(): void
    {
        $inactive = Product::factory()->inactive()->create();

        $this->postJson('/api/v1/opening-stocks', ['movement_date' => '27-10-2026', 'items' => []])
            ->assertStatus(422)
            ->assertJsonPath('errors.movement_date.0', 'Tanggal stok awal harus berformat Y-m-d.')
            ->assertJsonPath('errors.items.0', 'Tambahkan minimal 1 barang.');

        $errors = $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-27',
            'items' => [
                ['product_id' => $this->cable->id, 'qty' => '0', 'unit_cost' => -1],
                ['product_id' => $this->cable->id, 'qty' => '1.2345', 'unit_cost' => 1.5],
                ['product_id' => $inactive->id, 'qty' => 'abc'],
            ],
        ])->assertStatus(422)->json('errors');

        // assertEquals: same keys and messages, in any order.
        $this->assertEquals([
            'items.0.product_id' => ['Barang yang sama tidak boleh dipilih dua kali.'],
            'items.0.qty' => ['Jumlah harus lebih dari 0.'],
            'items.0.unit_cost' => ['Harga modal minimal 0.'],
            'items.1.product_id' => ['Barang yang sama tidak boleh dipilih dua kali.'],
            'items.1.qty' => ['Jumlah harus berupa angka, maksimal 3 angka di belakang koma.'],
            'items.1.unit_cost' => ['Harga modal harus berupa bilangan bulat.'],
            'items.2.product_id' => ['Barang tidak ditemukan atau sudah nonaktif.'],
            'items.2.qty' => ['Jumlah harus berupa angka, maksimal 3 angka di belakang koma.'],
            'items.2.unit_cost' => ['Harga modal wajib diisi.'],
        ], $errors);

        $this->assertSame(0, StockMovement::count());
    }

    public function test_date_must_be_within_the_last_30_days_and_not_in_the_future(): void
    {
        $item = [['product_id' => $this->cable->id, 'qty' => '1', 'unit_cost' => 0]];

        $this->postJson('/api/v1/opening-stocks', ['movement_date' => '2026-10-28', 'items' => $item])
            ->assertStatus(422)
            ->assertJsonPath('errors.movement_date.0', 'Tanggal stok awal tidak boleh melewati hari ini.');
        $this->postJson('/api/v1/opening-stocks', ['movement_date' => '2026-09-26', 'items' => $item])
            ->assertStatus(422)
            ->assertJsonPath('errors.movement_date.0', 'Tanggal stok awal paling lama 30 hari ke belakang (paling awal 27-09-2026).');
        $this->postJson('/api/v1/opening-stocks', ['movement_date' => '2026-09-27', 'items' => $item])->assertCreated();
    }

    public function test_import_template_has_header_and_example_row(): void
    {
        $response = $this->get('/api/v1/imports/opening-stocks/template', ['Accept' => 'application/json']);

        $response->assertOk();
        $this->assertStringContainsString('template-stok-awal.xlsx', $response->headers->get('Content-Disposition'));
        $rows = Xlsx::readFirstSheet($response->getFile()->getPathname());
        $this->assertSame(self::HEADER, $rows[1]);
        $this->assertSame(['KBL-NYM-2X15', '100', '10000', '2026-10-27'], $rows[2]);
    }

    public function test_import_creates_opening_movements_with_one_audit_entry(): void
    {
        $this->upload([
            self::HEADER,
            ['kbl-001', '12,5', 10000, '20/10/2026'],
            ['PPA-001', 4, '2500', ''],
        ])->assertOk()->assertExactJson(['data' => ['created' => 2, 'updated' => 0, 'skipped' => 0, 'total_value' => 135000]]);

        $cable = StockMovement::where('product_id', $this->cable->id)->sole();
        $this->assertSame([MovementType::Opening, '12.500', 125000, '2026-10-20'], [$cable->type, $cable->qty_change, $cable->value_change, $cable->movement_date->toDateString()]);
        $this->assertSame('2026-10-27', StockMovement::where('product_id', $this->pipe->id)->sole()->movement_date->toDateString());
        $log = AuditLog::where('action', AuditAction::OPENING_STOCK_IMPORTED)->sole();
        $this->assertSame('Impor stok awal dari stok-awal.xlsx: 2 barang', $log->summary);
    }

    public function test_import_with_invalid_rows_saves_nothing(): void
    {
        $used = Product::factory()->create(['sku' => 'USED-1']);
        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-27',
            'items' => [['product_id' => $used->id, 'qty' => '1', 'unit_cost' => 0]],
        ])->assertCreated();
        Product::factory()->inactive()->create(['sku' => 'OFF-1']);

        $response = $this->upload([
            self::HEADER,
            ['KBL-001', '10', '1000', ''],
            ['TIDAK-ADA', '1', '1', ''],
            ['kbl-001', '0', '12.500', '2026-11-01'],
            ['USED-1', '-1', 'abc', '2026-09-01'],
            ['OFF-1', '1', '1', '31/02/2026'],
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Ada 11 kesalahan di file. Tidak ada data yang disimpan. Perbaiki file lalu unggah lagi.')
            ->assertJsonPath('error_count', 11)
            ->assertJsonPath('errors', [
                ['row' => 3, 'column' => 'sku', 'message' => 'SKU TIDAK-ADA tidak ditemukan. Tambahkan barangnya dulu.'],
                ['row' => 4, 'column' => 'sku', 'message' => 'SKU KBL-001 sudah ada di baris 2.'],
                ['row' => 4, 'column' => 'jumlah', 'message' => 'Jumlah harus angka lebih dari 0, maksimal 3 angka di belakang koma.'],
                ['row' => 4, 'column' => 'harga_modal', 'message' => 'Harga modal harus bilangan bulat rupiah 0 atau lebih, tanpa titik atau koma.'],
                ['row' => 4, 'column' => 'tanggal', 'message' => 'Tanggal tidak boleh melewati hari ini.'],
                ['row' => 5, 'column' => 'sku', 'message' => 'Stok awal USED-1 sudah pernah diisi atau barang sudah punya transaksi.'],
                ['row' => 5, 'column' => 'jumlah', 'message' => 'Jumlah harus angka lebih dari 0, maksimal 3 angka di belakang koma.'],
                ['row' => 5, 'column' => 'harga_modal', 'message' => 'Harga modal harus bilangan bulat rupiah 0 atau lebih, tanpa titik atau koma.'],
                ['row' => 5, 'column' => 'tanggal', 'message' => 'Tanggal paling lama 30 hari ke belakang (paling awal 27-09-2026).'],
                ['row' => 6, 'column' => 'sku', 'message' => 'Barang OFF-1 sudah nonaktif.'],
                ['row' => 6, 'column' => 'tanggal', 'message' => 'Tanggal harus berformat YYYY-MM-DD atau DD/MM/YYYY.'],
            ]);

        $this->assertSame(1, StockMovement::count());
        $this->assertSame('0.000', StockBalance::where('product_id', $this->cable->id)->value('qty'));
    }

    public function test_import_needs_the_required_columns(): void
    {
        $this->upload([['sku', 'jumlah'], ['KBL-001', '1']])
            ->assertStatus(422)
            ->assertJsonPath('errors.0', ['row' => 1, 'column' => 'harga_modal', 'message' => 'Kolom "harga_modal" tidak ditemukan di baris judul. Gunakan template dari tombol "Unduh Template".']);
    }

    public function test_demo_seeder_fills_opening_stock_once_through_the_ledger(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->seed(DatabaseSeeder::class);

        $this->assertSame(4, StockMovement::where('type', MovementType::Opening)->where('notes', 'Data demo')->count());
        $this->assertSame('200.000', Product::where('sku', 'KBL-NYM-2X15')->first()->stockBalance->qty);
        $this->assertSame(6150000, (int) StockBalance::sum('stock_value'));
    }
}
