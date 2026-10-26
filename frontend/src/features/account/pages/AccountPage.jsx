import { useState } from 'react';
import { useAuth } from '../../../auth/useAuth.js';
import { Badge } from '../../../components/ui/Badge.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { ROLE_LABELS } from '../../../lib/constants.js';
import { formatDateTime } from '../../../lib/format.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { useChangePassword } from '../api.js';

const EMPTY = { current_password: '', password: '', password_confirmation: '' };

export default function AccountPage() {
  const { user } = useAuth();
  const toast = useToast();
  const changePassword = useChangePassword();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});
    setFormError('');
    try {
      await changePassword.mutateAsync(form);
      setForm(EMPTY);
      toast.success('Password berhasil diganti.');
    } catch (error) {
      const fields = fieldErrors(error);
      setErrors(fields);
      if (Object.keys(fields).length === 0) setFormError(error.message);
    }
  }

  return (
    <>
      <PageHeader title="Akun Saya" subtitle="Informasi akun dan penggantian password." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card title="Informasi akun" className="lg:col-span-2">
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted">Nama</dt>
              <dd className="mt-1 font-medium text-ink">{user.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-1 font-medium break-all text-ink">{user.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Peran</dt>
              <dd className="mt-1">
                <Badge tone="primary">{ROLE_LABELS[user.role]}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted">Login terakhir</dt>
              <dd className="mt-1 text-ink">{user.last_login_at ? formatDateTime(user.last_login_at) : 'Belum pernah'}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs text-muted">Untuk mengubah nama, email, atau peran, hubungi Owner.</p>
        </Card>

        <Card title="Ganti password" description="Setelah diganti, sesi login di perangkat lain akan keluar." className="lg:col-span-3">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError ? <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">{formError}</p> : null}
            <FormField label="Password saat ini" htmlFor="current-password" required error={errors.current_password}>
              <Input id="current-password" type="password" autoComplete="current-password" value={form.current_password} onChange={(e) => set('current_password', e.target.value)} invalid={Boolean(errors.current_password)} />
            </FormField>
            <FormField label="Password baru" htmlFor="new-password" required error={errors.password} hint="Minimal 8 karakter, berisi huruf dan angka.">
              <Input id="new-password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} invalid={Boolean(errors.password)} />
            </FormField>
            <FormField label="Ulangi password baru" htmlFor="confirm-password" required error={errors.password_confirmation}>
              <Input id="confirm-password" type="password" autoComplete="new-password" value={form.password_confirmation} onChange={(e) => set('password_confirmation', e.target.value)} invalid={Boolean(errors.password_confirmation)} />
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" loading={changePassword.isPending}>
                Simpan password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
