import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { MoneyInput } from '../../../components/ui/MoneyInput.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { fieldErrors, withoutError } from '../../../lib/formErrors.js';
import { minBusinessDate, todayIso } from '../../stock/utils.js';
import { useSaveProjectCost } from '../api.js';

// cost = null -> "Tambah Biaya Lain"; object -> "Ubah Biaya Lain". Render with key={cost?.id ?? 'new'}.
export function ProjectCostFormModal({ open, onClose, projectId, cost }) {
  const toast = useToast();
  const save = useSaveProjectCost(projectId);
  const isEdit = Boolean(cost);
  const [form, setForm] = useState({
    cost_date: cost?.cost_date ?? todayIso(),
    description: cost?.description ?? '',
    amount: cost?.amount ?? null,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  // Changing a field also hides its old error message (QA bug #12).
  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((current) => withoutError(current, field));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    const body = { cost_date: form.cost_date, description: form.description, amount: form.amount };
    try {
      if (isEdit) {
        await save.mutateAsync({ id: cost.id, ...body });
        toast.success('Perubahan biaya disimpan.');
      } else {
        await save.mutateAsync(body);
        toast.success('Biaya lain berhasil dicatat.');
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
      title={isEdit ? 'Ubah Biaya Lain' : 'Tambah Biaya Lain'}
      description="Biaya selain material, misalnya upah tukang, sewa alat atau transport."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={save.isPending}>
            Batal
          </Button>
          <Button type="submit" form="project-cost-form" loading={save.isPending}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="project-cost-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <FormField label="Tanggal" htmlFor="cost-date" required error={errors.cost_date} hint="Paling lama 30 hari ke belakang.">
          <DateInput
            id="cost-date"
            value={form.cost_date}
            onChange={(v) => set('cost_date', v)}
            min={minBusinessDate()}
            max={todayIso()}
            invalid={Boolean(errors.cost_date)}
          />
        </FormField>
        <FormField label="Keterangan" htmlFor="cost-description" required error={errors.description}>
          <Input
            id="cost-description"
            value={form.description}
            maxLength={200}
            placeholder="Contoh: Upah tukang minggu 1"
            onChange={(e) => set('description', e.target.value)}
            invalid={Boolean(errors.description)}
          />
        </FormField>
        <FormField label="Jumlah" htmlFor="cost-amount" required error={errors.amount}>
          <MoneyInput id="cost-amount" value={form.amount} onChange={(v) => set('amount', v)} invalid={Boolean(errors.amount)} />
        </FormField>
      </form>
    </Modal>
  );
}
