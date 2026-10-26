import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { MoneyInput } from '../../../components/ui/MoneyInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useSaveProject } from '../api.js';

const STATUS_OPTIONS = [
  { value: 'aktif', label: 'Aktif' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'batal', label: 'Batal' },
];

// project = null -> "Tambah Proyek"; object -> "Ubah Proyek". Render with key={project?.id ?? 'new'}.
// Only Owner and Finance open this form, so contract_value is always present in the API data here.
export function ProjectFormModal({ open, onClose, project }) {
  const toast = useToast();
  const save = useSaveProject();
  const isEdit = Boolean(project);
  const [form, setForm] = useState({
    code: project?.code ?? '',
    name: project?.name ?? '',
    client_name: project?.client_name ?? '',
    location: project?.location ?? '',
    contract_value: project?.contract_value ?? null,
    start_date: project?.start_date ?? '',
    end_date: project?.end_date ?? '',
    status: project?.status ?? 'aktif',
    notes: project?.notes ?? '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    const body = {
      code: form.code || null,
      name: form.name,
      client_name: form.client_name || null,
      location: form.location || null,
      contract_value: form.contract_value ?? 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      notes: form.notes || null,
    };
    try {
      if (isEdit) {
        await save.mutateAsync({ id: project.id, ...body, status: form.status });
        toast.success('Perubahan proyek disimpan.');
      } else {
        const result = await save.mutateAsync(body);
        toast.success(`Proyek ${result.data.code} berhasil ditambahkan.`);
      }
      onClose();
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(error.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={save.isPending ? () => {} : onClose}
      title={isEdit ? 'Ubah Proyek' : 'Tambah Proyek'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="project-form" loading={save.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="project-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="Kode proyek"
            htmlFor="project-code"
            required={isEdit}
            error={errors.code}
            hint={isEdit ? undefined : 'Kosongkan agar dibuat otomatis, contoh PRJ-0001.'}
          >
            <Input id="project-code" value={form.code} maxLength={30} onChange={(e) => set('code', e.target.value.toUpperCase())} invalid={Boolean(errors.code)} />
          </FormField>
          {isEdit ? (
            <FormField label="Status" htmlFor="project-status" required error={errors.status}>
              <Select id="project-status" value={form.status} onChange={(v) => set('status', v)} options={STATUS_OPTIONS} invalid={Boolean(errors.status)} />
            </FormField>
          ) : null}
        </div>
        <FormField label="Nama proyek" htmlFor="project-name" required error={errors.name}>
          <Input id="project-name" value={form.name} maxLength={150} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nama klien" htmlFor="project-client" error={errors.client_name}>
            <Input id="project-client" value={form.client_name} maxLength={150} onChange={(e) => set('client_name', e.target.value)} invalid={Boolean(errors.client_name)} />
          </FormField>
          <FormField label="Lokasi" htmlFor="project-location" error={errors.location}>
            <Input id="project-location" value={form.location} maxLength={200} onChange={(e) => set('location', e.target.value)} invalid={Boolean(errors.location)} />
          </FormField>
        </div>
        <FormField label="Nilai kontrak" htmlFor="project-contract" error={errors.contract_value} hint="Dalam rupiah, tanpa desimal.">
          <MoneyInput id="project-contract" value={form.contract_value} onChange={(v) => set('contract_value', v)} invalid={Boolean(errors.contract_value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Tanggal mulai" htmlFor="project-start" error={errors.start_date}>
            <DateInput id="project-start" value={form.start_date} onChange={(v) => set('start_date', v)} invalid={Boolean(errors.start_date)} />
          </FormField>
          <FormField label="Tanggal selesai" htmlFor="project-end" error={errors.end_date}>
            <DateInput id="project-end" value={form.end_date} onChange={(v) => set('end_date', v)} invalid={Boolean(errors.end_date)} />
          </FormField>
        </div>
        <FormField label="Catatan" htmlFor="project-notes" error={errors.notes}>
          <Textarea id="project-notes" rows={2} value={form.notes} maxLength={500} onChange={(e) => set('notes', e.target.value)} invalid={Boolean(errors.notes)} />
        </FormField>
      </form>
    </Modal>
  );
}
