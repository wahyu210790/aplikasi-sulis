import { useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Switch } from '../../../components/ui/Switch.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { ROLE_OPTIONS } from '../../../lib/constants.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useCreateUser, useUpdateUser } from '../api.js';

// user = null -> "Tambah Pengguna"; user = object -> "Ubah Pengguna". isSelf = editing your own account.
// The parent must render this with a key (e.g. key={user?.id ?? 'new'}) so the form resets.
export function UserFormModal({ open, onClose, user, isSelf }) {
  const toast = useToast();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    role: user?.role ?? 'gudang',
    password: '',
    is_active: user?.is_active ?? true,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const saving = createUser.isPending || updateUser.isPending;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    try {
      if (isEdit) {
        await updateUser.mutateAsync({ id: user.id, name: form.name, email: form.email, role: form.role, is_active: form.is_active });
        toast.success('Perubahan pengguna disimpan.');
      } else {
        await createUser.mutateAsync({ name: form.name, email: form.email, role: form.role, password: form.password });
        toast.success('Pengguna berhasil ditambahkan.');
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
      onClose={saving ? () => {} : onClose}
      title={isEdit ? 'Ubah Pengguna' : 'Tambah Pengguna'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Batal
          </Button>
          <Button type="submit" form="user-form" loading={saving}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
        <FormField label="Nama" htmlFor="user-name" required error={errors.name}>
          <Input id="user-name" value={form.name} onChange={(e) => set('name', e.target.value)} invalid={Boolean(errors.name)} />
        </FormField>
        <FormField label="Email" htmlFor="user-email" required error={errors.email}>
          <Input id="user-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} invalid={Boolean(errors.email)} />
        </FormField>
        <FormField label="Peran" htmlFor="user-role" required error={errors.role} hint={isSelf ? 'Anda tidak bisa mengubah peran akun Anda sendiri.' : undefined}>
          <Select id="user-role" value={form.role} onChange={(v) => set('role', v)} options={ROLE_OPTIONS} disabled={isSelf} invalid={Boolean(errors.role)} />
        </FormField>
        {isEdit ? (
          isSelf ? null : (
            <FormField label="Status" error={errors.is_active}>
              <Switch checked={form.is_active} onChange={(v) => set('is_active', v)} label={form.is_active ? 'Aktif' : 'Nonaktif'} />
            </FormField>
          )
        ) : (
          <FormField label="Password awal" htmlFor="user-password" required error={errors.password} hint="Minimal 8 karakter, berisi huruf dan angka.">
            <Input id="user-password" type="text" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} invalid={Boolean(errors.password)} />
          </FormField>
        )}
      </form>
    </Modal>
  );
}
