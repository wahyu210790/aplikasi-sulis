import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Save } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { ComboBox } from '../../../components/ui/ComboBox.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatDate, formatQty, parseQty } from '../../../lib/format.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useProjects } from '../../projects/api.js';
import { useCreateStockDocument } from '../api.js';
import { ItemsEditor } from '../components/ItemsEditor.jsx';
import { StickySubmitBar } from '../components/StickySubmitBar.jsx';
import { checkRows, minBusinessDate, newRow, rowsToItems, todayIso, unitOf } from '../utils.js';

// Barang Keluar form — docs/desain-v2.md B5.2, B12.7 (mobile-first; Gudang uses it on a phone).
export default function StockOutFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateStockDocument('/stock-outs');
  const projects = useProjects({ all: 1 }); // active projects only
  const [project, setProject] = useState(null);
  const [personName, setPersonName] = useState('');
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([newRow()]);
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);

  const projectOptions = (projects.data?.data ?? []).map((p) => ({
    value: p.id,
    label: `${p.code} — ${p.name}`,
    description: [p.client_name, p.location].filter(Boolean).join(' · ') || undefined,
  }));

  function handleSubmit(event) {
    event.preventDefault();
    const next = checkRows(rows);
    if (!project) next.project_id = 'Pilih proyek tujuan.';
    if (personName.trim().length < 2) next.person_name = 'Isi nama orang yang mengambil barang (minimal 2 huruf).';
    if (!date) next.transaction_date = 'Isi tanggal.';
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
        items: rowsToItems(rows),
      });
      toast.success(`Barang keluar ${result.data.number} tersimpan.`);
      navigate(`/barang-keluar/${result.data.id}`);
    } catch (error) {
      const fields = fieldErrors(error);
      // A business error (e.g. stock not enough) has no field: show it above the item list.
      setErrors(Object.keys(fields).length > 0 ? fields : { items: error.message });
      setConfirming(false);
    }
  }

  return (
    <>
      <PageHeader title="Catat Barang Keluar" subtitle="Barang yang diambil dari gudang untuk proyek." breadcrumb={[{ label: 'Barang Keluar', to: '/barang-keluar' }, { label: 'Baru' }]} />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <Card title="Tujuan">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Proyek" htmlFor="out-project" required error={errors.project_id} className="sm:col-span-2" hint="Hanya proyek berstatus Aktif.">
              <ComboBox
                id="out-project"
                value={project}
                onChange={setProject}
                options={projectOptions}
                loading={projects.isLoading}
                placeholder="Cari kode atau nama proyek…"
                emptyText="Tidak ada proyek aktif yang cocok"
                invalid={Boolean(errors.project_id)}
              />
            </FormField>
            <FormField label="Diambil oleh" htmlFor="out-person" required error={errors.person_name} hint="Nama orang yang membawa barang ke proyek.">
              <Input id="out-person" value={personName} maxLength={100} onChange={(e) => setPersonName(e.target.value)} invalid={Boolean(errors.person_name)} />
            </FormField>
            <FormField label="Tanggal" htmlFor="out-date" required error={errors.transaction_date}>
              <DateInput id="out-date" value={date} onChange={setDate} min={minBusinessDate()} max={todayIso()} invalid={Boolean(errors.transaction_date)} />
            </FormField>
            <FormField label="Catatan" htmlFor="out-notes" error={errors.notes} className="sm:col-span-2">
              <Textarea id="out-notes" rows={2} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} invalid={Boolean(errors.notes)} />
            </FormField>
          </div>
        </Card>

        <Card title="Barang" description="Pilih barang dan isi jumlah yang diambil.">
          <ItemsEditor rows={rows} onChange={setRows} errors={errors} />
        </Card>

        <StickySubmitBar summary={`${rows.length} barang`}>
          <Button variant="secondary" onClick={() => navigate('/barang-keluar')}>
            Batal
          </Button>
          <Button type="submit" size="lg" leftIcon={Save}>
            Simpan Barang Keluar
          </Button>
        </StickySubmitBar>
      </form>

      <Modal
        open={confirming}
        onClose={create.isPending ? () => {} : () => setConfirming(false)}
        title="Periksa sebelum menyimpan"
        description="Stok gudang langsung berkurang setelah disimpan."
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
          <dt className="text-muted">Diambil oleh</dt>
          <dd className="col-span-2 font-medium text-ink">{personName.trim()}</dd>
          <dt className="text-muted">Tanggal</dt>
          <dd className="col-span-2 font-medium text-ink">{formatDate(date)}</dd>
        </dl>
        <ul className="mt-4 divide-y divide-line rounded-control border border-line text-sm">
          {rows.map((row) => (
            <li key={row.key} className="flex items-start justify-between gap-3 px-3 py-2">
              <span className="min-w-0 text-ink">{row.product?.name}</span>
              <span className="font-medium whitespace-nowrap text-ink tabular-nums">{formatQty(parseQty(row.qty), unitOf(row.product))}</span>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}
