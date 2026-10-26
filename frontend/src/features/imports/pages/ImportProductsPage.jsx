import { useNavigate, useSearchParams } from 'react-router';
import { FilePlus2, PackagePlus, RefreshCw, SkipForward, Wallet } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { formatRupiah } from '../../../lib/format.js';
import { can } from '../../../lib/permissions.js';
import { downloadOpeningStockTemplate, downloadProductTemplate, useImportOpeningStocks, useImportProducts } from '../api.js';
import { ImportPanel } from '../components/ImportPanel.jsx';

// /barang/impor — tab "Barang" (Owner, Gudang) and tab "Stok Awal" (Owner, Finance). ?tab=stok-awal opens the second tab.
export default function ImportProductsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const importProducts = useImportProducts();
  const importOpening = useImportOpeningStocks();

  const tabs = [];
  if (can(user, 'products.import')) tabs.push({ key: 'barang', label: 'Barang' });
  if (can(user, 'stock.opening')) tabs.push({ key: 'stok-awal', label: 'Stok Awal' });
  const tab = tabs.some((t) => t.key === params.get('tab')) ? params.get('tab') : tabs[0].key;

  return (
    <>
      <PageHeader
        title="Impor dari Excel"
        subtitle={tab === 'barang' ? 'Tambah atau perbarui banyak barang sekaligus.' : 'Isi stok awal banyak barang sekaligus.'}
        breadcrumb={[{ label: 'Barang', to: '/barang' }, { label: 'Impor Excel' }]}
      />

      {tabs.length > 1 ? (
        <div className="mb-6">
          <Tabs tabs={tabs} value={tab} onChange={(key) => setParams({ tab: key }, { replace: true })} />
        </div>
      ) : null}

      {tab === 'barang' ? (
        <ImportPanel
          key="barang"
          id="import"
          templateName="template-impor-barang.xlsx"
          downloadTemplate={downloadProductTemplate}
          upload={importProducts}
          successMessage="Impor barang berhasil."
          rules={
            <>
              <li>
                Kolom wajib: <span className="font-medium text-ink">sku, nama, kategori, satuan</span>. Kolom lain: stok_minimum, catatan.
              </li>
              <li>SKU yang sudah ada akan diperbarui. SKU baru akan ditambahkan.</li>
              <li>Kategori dan satuan yang belum ada akan dibuat otomatis.</li>
              <li>Maksimal 2.000 baris dan 2 MB per file.</li>
            </>
          }
          renderResult={(result) => (
            <Card
              title="Impor berhasil"
              description="Data barang sudah disimpan."
              actions={
                <Button variant="secondary" size="sm" onClick={() => navigate('/barang')}>
                  Lihat Daftar Barang
                </Button>
              }
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="Barang baru" value={result.created} icon={FilePlus2} tone="success" />
                <StatCard label="Barang diperbarui" value={result.updated} icon={RefreshCw} tone="info" />
                <StatCard label="Tidak berubah" value={result.skipped} icon={SkipForward} tone="primary" />
              </div>
              {result.categories_created.length > 0 ? (
                <p className="mt-4 text-sm text-ink">
                  <span className="font-medium">Kategori baru:</span> {result.categories_created.join(', ')}
                </p>
              ) : null}
              {result.units_created.length > 0 ? (
                <p className="mt-2 text-sm text-ink">
                  <span className="font-medium">Satuan baru:</span> {result.units_created.join(', ')}
                </p>
              ) : null}
            </Card>
          )}
        />
      ) : (
        <ImportPanel
          key="stok-awal"
          id="opening-import"
          templateName="template-stok-awal.xlsx"
          downloadTemplate={downloadOpeningStockTemplate}
          upload={importOpening}
          successMessage="Impor stok awal berhasil."
          rules={
            <>
              <li>
                Kolom wajib: <span className="font-medium text-ink">sku, jumlah, harga_modal</span> (rupiah per satuan). Kolom tanggal boleh kosong (= hari ini).
              </li>
              <li>Hanya untuk barang yang belum punya riwayat stok sama sekali.</li>
              <li>Tanggal paling lama 30 hari ke belakang dan tidak boleh di masa depan.</li>
              <li>Maksimal 2.000 baris dan 2 MB per file.</li>
            </>
          }
          renderResult={(result) => (
            <Card
              title="Impor berhasil"
              description="Stok awal sudah dicatat."
              actions={
                <Button variant="secondary" size="sm" onClick={() => navigate('/barang')}>
                  Lihat Daftar Barang
                </Button>
              }
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <StatCard label="Barang diisi stok awal" value={result.created} icon={PackagePlus} tone="success" />
                <StatCard label="Total nilai stok awal" value={formatRupiah(result.total_value)} icon={Wallet} tone="info" />
              </div>
            </Card>
          )}
        />
      )}
    </>
  );
}
