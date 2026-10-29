import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../components/ui/Button.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Textarea } from '../../../components/ui/Textarea.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { minBusinessDate, todayIso } from '../../stock/utils.js';
import { useCreateOpname } from '../api.js';

// "Buat Stok Opname": date + notes -> a new draft, then opens its counting page.
export function OpnameCreateModal({ open, onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateOpname();
  const [form, setForm] = useState({ opname_date: todayIso(), notes: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    try {
      const result = await create.mutateAsync({ opname_date: form.opname_date, notes: form.notes || null });
      toast.success(`Stok opname ${result.data.number} dibuat. Tambahkan barang yang dihitung.`);
      onClose();
      navigate(`/stok-opname/${result.data.id}`);
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(error.message);
    }
  }

  return (
    <Modal
      open={open}
      onClose={create.isPending ? () => {} : onClose}
      title="Buat Stok Opname"
      description="Hitung stok fisik di gudang, lalu ajukan ke Owner. Stok baru berubah setelah Owner menyetujui."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Batal
          </Button>
          <Button type="submit" form="opname-create-form" loading={create.isPending}>
            Buat
          </Button>
        </>
      }
    >
      <form id="opname-create-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <FormField label="Tanggal opname" htmlFor="opname-date" required error={errors.opname_date} hint="Paling lama 30 hari ke belakang.">
          <DateInput
            id="opname-date"
            value={form.opname_date}
            onChange={(v) => setForm((f) => ({ ...f, opname_date: v }))}
            min={minBusinessDate()}
            max={todayIso()}
            invalid={Boolean(errors.opname_date)}
          />
        </FormField>
        <FormField label="Catatan" htmlFor="opname-notes" error={errors.notes}>
          <Textarea
            id="opname-notes"
            value={form.notes}
            maxLength={500}
            placeholder="Contoh: Opname akhir bulan rak A"
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            invalid={Boolean(errors.notes)}
          />
        </FormField>
      </form>
    </Modal>
  );
}
