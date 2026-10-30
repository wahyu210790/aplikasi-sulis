<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Project;
use App\Models\ProjectCost;
use App\Models\Purchase;
use App\Models\Unit;
use App\Models\User;
use App\Support\ReportExport;
use App\Support\Xlsx;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** docs/desain-v2.md T6.01: Excel export of Laba Proyek, Nilai Stok and Pergerakan Barang (same filters, Gudang without money). */
class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private User $gudang;

    private Product $cable;

    private Product $pipe;

    private Project $projectA;

    private Project $projectB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo('2026-10-27 10:00:00');
        $this->owner = User::factory()->owner()->create(['name' => 'Owner Satu']);
        $this->gudang = User::factory()->gudang()->create(['name' => 'Andi']);
        $this->cable = Product::factory()->create(['sku' => 'KBL-1', 'name' => 'Kabel NYM', 'unit_id' => Unit::factory()->create(['symbol' => 'm'])->id]);
        $this->pipe = Product::factory()->create(['sku' => 'PPA-1', 'name' => 'Pipa PVC']);
        $this->projectA = Project::factory()->create(['code' => 'PRJ-T0001', 'name' => 'Gedung A', 'contract_value' => 10000000]);
        $this->projectB = Project::factory()->create(['code' => 'PRJ-T0002', 'name' => 'Gedung B', 'contract_value' => 5000000]);

        Sanctum::actingAs($this->owner);
        $this->postJson('/api/v1/opening-stocks', [
            'movement_date' => '2026-10-01',
            'items' => [
                ['product_id' => $this->cable->id, 'qty' => '100', 'unit_cost' => 10000],
                ['product_id' => $this->pipe->id, 'qty' => '3', 'unit_cost' => 25000],
            ],
        ])->assertCreated();
        $purchase = Purchase::factory()->withItem($this->cable, '100', 13000)->create(['purchase_date' => '2026-10-20']);
        Sanctum::actingAs($this->gudang);
        $this->postJson("/api/v1/purchases/{$purchase->id}/receive")->assertOk();      // cable: 200 m, 2.300.000, avg 11.500
        $this->postJson('/api/v1/stock-outs', [
            'project_id' => $this->projectA->id, 'person_name' => 'Budi', 'transaction_date' => '2026-10-27',
            'items' => [['product_id' => $this->cable->id, 'qty' => '12.5']],
        ])->assertCreated();                                                               // A: 12,5 m × 11.500 = 143.750
        ProjectCost::factory()->create(['project_id' => $this->projectA->id, 'amount' => 856250]);
    }

    /** Downloads one export and returns its rows (row 1 = header) as strings. */
    private function rows(TestResponse $response, string $name): array
    {
        $response->assertOk()->assertHeader('content-type', ReportExport::MIME);
        $this->assertStringContainsString("{$name}-2026-10-27.xlsx", $response->headers->get('content-disposition'));

        return array_values(Xlsx::readFirstSheet($response->baseResponse->getFile()->getPathname()));
    }

    public function test_project_profit_export_has_every_project_and_the_totals(): void
    {
        foreach ([$this->owner, User::factory()->finance()->create()] as $user) {
            Sanctum::actingAs($user);
            $rows = $this->rows($this->get('/api/v1/reports/project-profit/export'), 'laba-proyek');

            $this->assertSame(['Kode', 'Nama Proyek', 'Klien', 'Status', 'Nilai Kontrak', 'Biaya Material', 'Biaya Lain', 'Laba', 'Margin (%)'], $rows[0]);
            $this->assertCount(4, $rows);
            $this->assertSame([$this->projectA->code, 'Gedung A', $this->projectA->client_name ?? '', 'Aktif', '10000000', '143750', '856250', '9000000', '90'], $rows[1]);
            $this->assertSame(['Gedung B', '5000000', '0', '0', '5000000', '100'], [$rows[2][1], $rows[2][4], $rows[2][5], $rows[2][6], $rows[2][7], $rows[2][8]]);
            $this->assertSame(['TOTAL', '', '', '', '15000000', '143750', '856250', '14000000', '93.3'], $rows[3]);
        }
    }

    public function test_project_profit_export_respects_the_status_filter(): void
    {
        $this->projectB->update(['status' => 'selesai']);
        Sanctum::actingAs($this->owner);

        $rows = $this->rows($this->get('/api/v1/reports/project-profit/export?status=selesai'), 'laba-proyek');
        $this->assertCount(3, $rows);
        $this->assertSame('Gedung B', $rows[1][1]);
        $this->assertSame('Selesai', $rows[1][3]);
        $this->assertSame('5000000', $rows[2][4]);
    }

    public function test_stock_value_export_has_all_products_and_the_total(): void
    {
        Product::factory()->create(['sku' => 'SKL-1', 'name' => 'Saklar']);
        Sanctum::actingAs($this->owner);

        $rows = $this->rows($this->get('/api/v1/reports/stock-value/export?per_page=1'), 'nilai-stok');
        $this->assertSame(['SKU', 'Nama Barang', 'Kategori', 'Satuan', 'Jumlah', 'Harga Modal Rata-rata', 'Nilai Stok', 'Harga Modal Ada', 'Status'], $rows[0]);
        $this->assertCount(5, $rows, 'per_page does not limit the export');
        $this->assertSame(['KBL-1', 'Kabel NYM', 'm', '187.5', '11500', '2156250', 'Ya', 'Aktif'], [$rows[1][0], $rows[1][1], $rows[1][3], $rows[1][4], $rows[1][5], $rows[1][6], $rows[1][7], $rows[1][8]]);
        $this->assertSame(['PPA-1', '3', '25000', '75000'], [$rows[2][0], $rows[2][4], $rows[2][5], $rows[2][6]]);
        $this->assertSame(['SKL-1', '0', '0', '0', 'Belum'], [$rows[3][0], $rows[3][4], $rows[3][5], $rows[3][6], $rows[3][7]]);
        $this->assertSame(['TOTAL', '2231250'], [$rows[4][0], $rows[4][6]]);

        $rows = $this->rows($this->get('/api/v1/reports/stock-value/export?search=pipa'), 'nilai-stok');
        $this->assertCount(3, $rows);
        $this->assertSame(['PPA-1', '75000'], [$rows[1][0], $rows[1][6]]);
        $this->assertSame('75000', $rows[2][6]);
    }

    public function test_movements_export_for_owner_has_money_columns_and_respects_filters(): void
    {
        Sanctum::actingAs($this->owner);

        $rows = $this->rows($this->get('/api/v1/reports/movements/export'), 'pergerakan-barang');
        $this->assertSame(['Tanggal', 'Jenis', 'SKU', 'Nama Barang', 'Satuan', 'Perubahan', 'Stok Setelah', 'Dokumen', 'Proyek', 'Pengambil / Pengembali', 'Dicatat Oleh', 'Catatan', 'Harga Satuan', 'Perubahan Nilai', 'Nilai Stok Setelah'], $rows[0]);
        $this->assertCount(6, $rows);
        // TOTAL: products differ, so no quantity sum; the value changes add up to today's stock value.
        $this->assertSame(['TOTAL', '', '', '', '', '', '', '', '', '', '', '', '', '2231250', ''], $rows[5]);
        $out = $rows[1];
        $this->assertSame(['2026-10-27', 'Keluar ke Proyek', 'KBL-1', 'Kabel NYM', 'm', '-12.5', '187.5'], array_slice($out, 0, 7));
        $this->assertStringStartsWith('BK-', $out[7]);
        $this->assertSame([$this->projectA->code.' — Gedung A', 'Budi', 'Andi', '11500', '-143750', '2156250'], [$out[8], $out[9], $out[10], $out[12], $out[13], $out[14]]);

        $rows = $this->rows($this->get("/api/v1/reports/movements/export?product_id={$this->pipe->id}"), 'pergerakan-barang');
        $this->assertCount(3, $rows);
        $this->assertSame(['Stok Awal', 'PPA-1', '3', '75000'], [$rows[1][1], $rows[1][2], $rows[1][5], $rows[1][13]]);
        $this->assertSame(['TOTAL', '3', '75000'], [$rows[2][0], $rows[2][5], $rows[2][13]]);

        $rows = $this->rows($this->get('/api/v1/reports/movements/export?type=purchase_in&date_from=2026-10-20&date_to=2026-10-20'), 'pergerakan-barang');
        $this->assertCount(3, $rows);
        $this->assertSame(['2026-10-20', 'Pembelian Masuk', '100', '1300000'], [$rows[1][0], $rows[1][1], $rows[1][5], $rows[1][13]]);

        $rows = $this->rows($this->get("/api/v1/reports/movements/export?project_id={$this->projectB->id}"), 'pergerakan-barang');
        $this->assertCount(2, $rows, 'only the header and an empty TOTAL when nothing matches');
        $this->assertSame(['TOTAL', '0'], [$rows[1][0], $rows[1][13]]);
    }

    public function test_movements_export_for_gudang_has_no_money(): void
    {
        Sanctum::actingAs($this->gudang);

        $rows = $this->rows($this->get('/api/v1/reports/movements/export'), 'pergerakan-barang');
        $this->assertSame(['Tanggal', 'Jenis', 'SKU', 'Nama Barang', 'Satuan', 'Perubahan', 'Stok Setelah', 'Dokumen', 'Proyek', 'Pengambil / Pengembali', 'Dicatat Oleh', 'Catatan'], $rows[0]);
        $this->assertCount(6, $rows);
        $this->assertSame('TOTAL', $rows[5][0]);
        foreach ($rows as $row) {
            $this->assertCount(12, $row);
            foreach (['11500', '143750', '-143750', '2156250', '1300000', '1000000', '75000', '25000', '13000', '10000'] as $money) {
                $this->assertNotContains($money, $row, 'Gudang export must not contain rupiah values');
            }
        }

        $this->get('/api/v1/reports/project-profit/export')->assertForbidden();
        $this->get('/api/v1/reports/stock-value/export')->assertForbidden();
    }

    public function test_rupiah_cells_are_rounded_like_the_screen(): void
    {
        // QA bug #22: "12666.6538" was written as is; the screen shows Rp 12.667.
        $this->assertSame(12667, ReportExport::rupiah('12666.6538'));
        $this->assertSame(12667, ReportExport::rupiah('12666.5000'));
        $this->assertSame(12666, ReportExport::rupiah('12666.4999'));
        $this->assertSame(11500, ReportExport::rupiah('11500'));
        $this->assertNull(ReportExport::rupiah(null));
    }

    public function test_export_filters_are_validated(): void
    {
        Sanctum::actingAs($this->owner);

        $this->getJson('/api/v1/reports/movements/export?date_from=2026-10-27&date_to=2026-10-01')->assertStatus(422)->assertJsonValidationErrors('date_to');
        // QA bug #8: the message matches the screen check, on every list with a date range.
        foreach (['/api/v1/reports/movements', '/api/v1/reports/cost-history', '/api/v1/stock-transactions', '/api/v1/purchases', '/api/v1/audit-logs', "/api/v1/products/{$this->pipe->id}/movements"] as $url) {
            $this->getJson("{$url}?date_from=2026-10-27&date_to=2026-10-01")->assertStatus(422)
                ->assertJsonPath('errors.date_to.0', 'Tanggal "Sampai" tidak boleh sebelum tanggal "Dari".');
        }
        $this->getJson('/api/v1/reports/project-profit/export?status=hilang')->assertStatus(422)->assertJsonValidationErrors('status');
        $this->getJson('/api/v1/reports/movements/export?type=apa')->assertStatus(422)->assertJsonValidationErrors('type');
    }
}
