import { useState } from 'react';
import { Boxes, Pencil, Plus, TriangleAlert, Wallet } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';
import { IconButton } from '../components/ui/IconButton.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ComboBox } from '../components/ui/ComboBox.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { Drawer } from '../components/ui/Drawer.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { FilterBar } from '../components/ui/FilterBar.jsx';
import { FormField } from '../components/ui/FormField.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Money } from '../components/ui/Money.jsx';
import { PageHeader } from '../components/ui/PageHeader.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { useToast } from '../components/ui/useToast.js';
import { ROLE_LABELS, ROLE_OPTIONS } from '../lib/constants.js';

const ROWS = [
  { id: 1, name: 'Owner Demo', email: 'owner@sulis.test', role: 'owner', is_active: true, salary: 1322500 },
  { id: 2, name: 'Gudang Demo', email: 'gudang@sulis.test', role: 'gudang', is_active: true, salary: 575000 },
  { id: 3, name: 'Finance Demo', email: 'finance@sulis.test', role: 'finance', is_active: false, salary: 0 },
];

const PRODUCTS = [
  { value: 1, label: 'Kabel NYM 3x2.5', description: 'KBL-001 · m' },
  { value: 2, label: 'Pipa PVC 1/2"', description: 'PVC-012 · batang' },
  { value: 3, label: 'Semen 50 kg', description: 'SMN-050 · sak' },
];

export default function UiShowcasePart2() {
  const toast = useToast();
  const [tab, setTab] = useState('semua');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [product, setProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const columns = [
    {
      key: 'name',
      header: 'Nama',
      render: (row) => (
        <div>
          <div className="font-medium text-ink">{row.name}</div>
          <div className="text-xs text-muted">{row.email}</div>
        </div>
      ),
    },
    { key: 'role', header: 'Peran', render: (row) => ROLE_LABELS[row.role] },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge kind="user" status={row.is_active ? 'active' : 'inactive'} /> },
    { key: 'salary', header: 'Nilai', align: 'right', render: (row) => <Money value={row.salary} /> },
    { key: 'actions', header: 'Aksi', align: 'right', render: () => <IconButton icon={Pencil} label="Ubah" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contoh Halaman"
        subtitle="PageHeader, Tabs, FilterBar, DataTable, Pagination"
        breadcrumb={[{ label: 'Beranda', to: '/' }, { label: 'Contoh Halaman' }]}
        actions={<Button leftIcon={Plus} onClick={() => setModalOpen(true)}>Tambah</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Nilai stok" value={<Money value={125750000} />} icon={Wallet} hint="Per hari ini" />
        <StatCard label="Jenis barang" value="248" icon={Boxes} tone="info" />
        <StatCard label="Stok menipis" value="7" icon={TriangleAlert} tone="warning" />
      </div>

      <Tabs tabs={[{ key: 'semua', label: 'Semua' }, { key: 'aktif', label: 'Aktif' }, { key: 'nonaktif', label: 'Nonaktif' }]} value={tab} onChange={setTab} />

      <FilterBar>
        <SearchInput value={search} onChange={setSearch} placeholder="Cari nama atau email…" />
        <div className="w-full sm:w-48">
          <Select value={role} onChange={setRole} options={[{ value: '', label: 'Semua peran' }, ...ROLE_OPTIONS]} />
        </div>
        <Button variant="secondary" onClick={() => setLoading((v) => !v)}>
          {loading ? 'Tampilkan data' : 'Tampilkan loading'}
        </Button>
      </FilterBar>

      <DataTable columns={columns} rows={ROWS} loading={loading} />
      <Pagination meta={{ current_page: page, last_page: 3, per_page: 20, total: 53 }} onPageChange={setPage} />

      <Card title="ComboBox">
        <div className="max-w-md">
          <FormField label="Barang" htmlFor="ui-product">
            <ComboBox id="ui-product" value={product} onChange={setProduct} options={PRODUCTS} />
          </FormField>
        </div>
      </Card>

      <Card title="Dialog, Drawer, Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Buka Modal</Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>Buka Konfirmasi</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Buka Drawer</Button>
          <Button variant="secondary" onClick={() => toast.success('Data berhasil disimpan.')}>Toast sukses</Button>
          <Button variant="secondary" onClick={() => toast.error('Gagal menyimpan data.')}>Toast gagal</Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card padded={false}>
          <EmptyState title="Belum ada barang" description="Tambahkan barang pertama Anda." action={<Button size="sm" leftIcon={Plus}>Tambah Barang</Button>} />
        </Card>
        <Card padded={false}>
          <ErrorState onRetry={() => toast.info('Memuat ulang…')} />
        </Card>
        <Card title="Skeleton">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-3 h-4 w-1/2" />
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tambah Pengguna"
        description="Contoh modal dengan form."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button onClick={() => setModalOpen(false)}>Simpan</Button>
          </>
        }
      >
        <FormField label="Nama" htmlFor="ui-modal-name" required>
          <Input id="ui-modal-name" />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          toast.success('Transaksi dibatalkan.');
        }}
        title="Batalkan transaksi?"
        message="Stok akan dikembalikan seperti sebelum transaksi ini."
        confirmLabel="Ya, batalkan"
        tone="danger"
        requireReason
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="p-5">
          <p className="font-semibold text-white">Contoh Drawer</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setDrawerOpen(false)}>Tutup</Button>
        </div>
      </Drawer>
    </div>
  );
}
