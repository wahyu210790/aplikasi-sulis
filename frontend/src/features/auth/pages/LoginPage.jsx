import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router';
import { CircleAlert, Eye, EyeOff, Info } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { FullPageSpinner } from '../../../components/layout/FullPageSpinner.jsx';

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  const sessionExpired = searchParams.get('alasan') === 'sesi';

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!email.trim()) nextErrors.email = 'Email wajib diisi.';
    if (!password) nextErrors.password = 'Password wajib diisi.';
    setErrors(nextErrors);
    setServerError('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      setServerError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-sm font-bold">BEP</div>
          <p className="text-sm font-medium text-slate-300">PT. Best Engineer Persada</p>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight">Sistem Stok Gudang</h1>
          <p className="mt-4 text-base leading-relaxed text-slate-300">
            Catat barang masuk dan keluar per proyek, pantau stok, dan lihat keuntungan setiap proyek.
          </p>
        </div>
        <p className="text-xs text-slate-500">© 2026 PT. Best Engineer Persada</p>
      </div>

      <div className="flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-control bg-primary text-sm font-bold text-white">BEP</div>
            <p className="mt-4 text-sm text-muted">PT. Best Engineer Persada</p>
            <p className="text-lg font-semibold text-ink">Sistem Stok Gudang</p>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-ink">Masuk ke akun Anda</h2>
          <p className="mt-1 text-sm text-muted">Gunakan email dan password yang diberikan Owner.</p>

          {sessionExpired && !serverError ? (
            <div className="mt-6 flex items-start gap-2 rounded-control bg-info-soft px-3 py-2.5 text-sm text-info">
              <Info aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              Sesi Anda telah berakhir. Silakan masuk kembali.
            </div>
          ) : null}

          {serverError ? (
            <div role="alert" className="mt-6 flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2.5 text-sm text-danger">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {serverError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <FormField label="Email" htmlFor="login-email" error={errors.email}>
              <Input
                id="login-email"
                type="email"
                autoComplete="username"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                invalid={Boolean(errors.email)}
                placeholder="nama@perusahaan.com"
              />
            </FormField>
            <FormField label="Password" htmlFor="login-password" error={errors.password}>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  invalid={Boolean(errors.password)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
                >
                  {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
            <Button type="submit" fullWidth size="lg" loading={submitting}>
              Masuk
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted lg:hidden">© 2026 PT. Best Engineer Persada</p>
        </div>
      </div>
    </div>
  );
}
