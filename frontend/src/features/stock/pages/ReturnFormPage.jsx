import { useState } from 'react';
import { useNavigate } from 'react-router';
import { PackageOpen, Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { ComboBox } from '../../../components/ui/ComboBox.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { NumberInput } from '../../../components/ui/NumberInput.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Spinner } from '../../../components/ui/Spinner.jsx';
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatDate, formatQty, parseQty } from '../../../lib/format.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useProjects } from '../../projects/api.js';
import { useCreateStockDocument, useIssuedItems } from '../api.js';
import { StickySubmitBar } from '../components/StickySubmitBar.jsx';
import { minBusinessDate, todayIso } from '../utils.js';

// Pengembalian form — docs/desain-v2.md B5.3: choose a project (Aktif or Selesai), then the products it still holds,
// then how much comes back. Errors are kept per product: { 'product-12': 'message' }.
export default function ReturnFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateStockDocument('/stock-returns');
  const active = useProjects({ all: 1, status: 'aktif' });
  const finished = useProjects({ all: 1, status: 'selesai' });
  const [project, setProject] = useState(null);
  const [personName, setPersonName] = useState('');
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState({}); // { productId: typed text }
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);
  const issued = useIssuedItems(project?.value);

  const projectOptions = [...(active.data?.data ?? []), ...(finished.data?.data ?? [])].map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
    description: p.status === 'selesai' ? 'Proyek selesai' : 'Proyek aktif',
  }));
  const items = issued.data?.data ?? [];
  const chosen = items.filter((item) => (qty[item.product.id] ?? '').trim() !== '');

  function chooseProject(option) {
    setProject(option);
    setQty({});
    setErrors({});
  }

  function handleSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!project) next.project_id = 'Pilih proyek asal barang.';
    if (personName.trim().length < 2) next.person_name = 'Isi nama orang yang mengembalikan barang (minimal 2 huruf).';
    if (!date) next.transaction_date = 'Isi tanggal.';
    if (project && chosen.length === 0) next.items = 'Isi jumlah kembali untuk minimal 1 barang.';
    chosen.forEach((item) => {
      const value = parseQty(qty[item.product.id]);
      if (value === null || Number(value) <= 0) next[`product-${item.product.id}`] = 'Isi jumlah lebih dari 0 (maksimal 3 angka di belakang koma).';
      else if (Number(value) > Number(item.qty)) next[`product-${item.product.id}`] = `Maksimal ${formatQty(item.qty, item.product.unit_symbol)}.`;
    });
    setErrors(next);
    if (Object.keys(next).length === 0) setConfirming(true);
  }

  async function handleConfirm() {
    try {
      const result = await create.mutateAsync({
        project_id: project.value,
        person_name: personName,
        transaction_date: date,
        notes,
        items: chosen.map((item) => ({ product_id: item.product.id, qty: parseQty(qty[item.product.id]) })),
      });
      toast.success(`Pengembalian ${result.data.number} tersimpan.`);
      navigate(`/pengembalian/${result.data.id}`);
    } catch (error) {
      const fields = fieldErrors(error);
      // "items.2.qty" -> the 3rd chosen product; an error without a field goes above the list.
      const mapped = {};
      Object.entries(fields).forEach(([key, message]) => {
        const match = key.match(/^items\.(\d+)\./);
        mapped[match && chosen[Number(match[1])] ? `product-${chosen[Number(match[1])].product.id}` : key] = message;
      });
      setErrors(Object.keys(mapped).length > 0 ? mapped : { items: error.message });
      setConfirming(false);
    }
  }

  return (
    <>
      <PageHeader title="Catat Pengembalian" subtitle="Barang sisa proyek yang kembali ke gudang." breadcrumb={[{ label: 'Pengembalian', to: '/pengembalian' }, { label: 'Baru' }]} />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Card title="Asal barang">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Proyek" htmlFor="return-project" required error={errors.project_id} className="sm:col-span-2" hint="Proyek berstatus Aktif atau Selesai.">
              <ComboBox
                id="return-project"
                value={project}
                onChange={chooseProject}
                options={projectOptions}
                loading={active.isLoading || finished.isLoading}
                placeholder="Cari kode atau nama proyek…"
                emptyText="Tidak ada proyek yang cocok"
                invalid={Boolean(errors.project_id)}
              />
            </FormField>
            <FormField label="Dikembalikan oleh" htmlFor="return-person" required error={errors.person_name}>
              <Input id="return-person" value={personName} maxLength={100} onChange={(e) => setPersonName(e.target.value)} invalid={Boolean(errors.person_name)} />
            </FormField>
            <FormField label="Tanggal" htmlFor="return-date" required error={errors.transaction_date}>
              <DateInput id="return-date" value={date} onChange={setDate} min={minBusinessDate()} max={todayIso()} invalid={Boolean(errors.transaction_date)} />
            </FormField>
            <FormField label="Catatan" htmlFor="return-notes" error={errors.notes} className="sm:col-span-2">
              <Textarea id="return-notes" rows={2} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} invalid={Boolean(errors.notes)} />
            </FormField>
          </div>
        </Card>

        <Card title="Barang yang kembali" description="Isi jumlah hanya untuk barang yang dikembalikan. Kosongkan yang tidak.">
          {errors.items ? (
            <p role="alert" className="mb-3 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
              {errors.items}
            </p>
          ) : null}
          {!project ? (
            <EmptyState icon={PackageOpen} title="Pilih proyek dulu" description="Daftar barang yang masih ada di proyek akan tampil di sini." />
          ) : issued.isLoading ? (
            <div className="flex justify-center py-8 text-muted">
              <Spinner className="h-6 w-6" />
            </div>
          ) : issued.isError ? (
            <ErrorState message={issued.error.message} onRetry={() => issued.refetch()} />
          ) : items.length === 0 ? (
            <EmptyState icon={PackageOpen} title="Tidak ada barang di proyek ini" description="Belum ada barang keluar ke proyek ini, atau semuanya sudah dikembalikan." />
          ) : (
            <ul className="space-y-3">
              {items.map((item) => {
                const key = `product-${item.product.id}`;
                const unit = item.product.unit_symbol;
                return (
                  <li key={item.product.id} className="grid gap-3 rounded-card border border-line bg-canvas p-3 sm:grid-cols-3 sm:items-start sm:p-4">
                    <div className="min-w-0 sm:col-span-2">
                      <p className="font-medium text-ink">{item.product.name}</p>
                      <p className="font-mono text-xs text-muted">{item.product.sku}</p>
                      <p className="mt-1 text-sm text-muted">
                        Masih di proyek: <span className="font-medium text-ink tabular-nums">{formatQty(item.qty, unit)}</span>
                      </p>
                    </div>
                    <FormField
                      label="Jumlah kembali"
                      htmlFor={`return-qty-${item.product.id}`}
                      error={errors[key]}
                      hint={item.product.is_active ? undefined : 'Barang nonaktif — tidak bisa dikembalikan.'}
                    >
                      <NumberInput
                        id={`return-qty-${item.product.id}`}
                        value={qty[item.product.id] ?? ''}
                        onChange={(text) => setQty((q) => ({ ...q, [item.product.id]: text }))}
                        suffix={unit}
                        placeholder="0"
                        disabled={!item.product.is_active}
                        invalid={Boolean(errors[key])}
                      />
                    </FormField>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <StickySubmitBar summary={`${chosen.length} barang dikembalikan`}>
          <Button variant="secondary" onClick={() => navigate('/pengembalian')}>
            Batal
          </Button>
          <Button type="submit" size="lg" leftIcon={Save}>
            Simpan Pengembalian
          </Button>
        </StickySubmitBar>
      </form>

      <Modal
        open={confirming}
        onClose={create.isPending ? () => {} : () => setConfirming(false)}
        title="Periksa sebelum menyimpan"
        description="Stok gudang langsung bertambah setelah disimpan."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)} disabled={create.isPending}>
              Periksa Lagi
            </Button>
            <Button onClick={handleConfirm} loading={create.isPending}>
              Ya, Simpan
            </Button>
          </>
        }
      >
        <dl className="grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
          <dt className="text-muted">Proyek</dt>
          <dd className="col-span-2 font-medium text-ink">{project?.label}</dd>
          <dt className="text-muted">Dikembalikan oleh</dt>
          <dd className="col-span-2 font-medium text-ink">{personName.trim()}</dd>
          <dt className="text-muted">Tanggal</dt>
          <dd className="col-span-2 font-medium text-ink">{formatDate(date)}</dd>
        </dl>
        <ul className="mt-4 divide-y divide-line rounded-control border border-line text-sm">
          {chosen.map((item) => (
            <li key={item.product.id} className="flex items-start justify-between gap-3 px-3 py-2">
              <span className="min-w-0 text-ink">{item.product.name}</span>
              <span className="font-medium whitespace-nowrap text-ink tabular-nums">
                {formatQty(parseQty(qty[item.product.id]), item.product.unit_symbol)}
              </span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
