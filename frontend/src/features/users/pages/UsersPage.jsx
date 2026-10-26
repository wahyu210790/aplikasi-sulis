import { useState } from 'react';
import { KeyRound, Pencil, Plus, UserCheck, UserX, Users } from 'lucide-react';
import { useAuth } from '../../../auth/useAuth.js';
import { Button } from '../../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { SearchInput } from '../../../components/ui/SearchInput.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { StatusBadge } from '../../../components/ui/StatusBadge.jsx';
import { Badge } from '../../../components/ui/Badge.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { ROLE_LABELS, ROLE_OPTIONS } from '../../../lib/constants.js';
import { formatDateTime } from '../../../lib/format.js';
import { useResetPassword, useUpdateUser, useUsers } from '../api.js';
import { TemporaryPasswordModal } from '../components/TemporaryPasswordModal.jsx';
import { UserFormModal } from '../components/UserFormModal.jsx';

const ROLE_FILTER = [{ value: '', label: 'Semua peran' }, ...ROLE_OPTIONS];
const STATUS_FILTER = [
  { value: '', label: 'Semua status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

export default function UsersPage() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [formUser, setFormUser] = useState(undefined); // undefined = closed, null = new, object = edit
  const [resetUser, setResetUser] = useState(null);
  const [toggleUser, setToggleUser] = useState(null);
  const [tempPassword, setTempPassword] = useState(null); // { name, password }

  const params = { search, role, is_active: isActive, page, per_page: 20, sort: 'name', direction: 'asc' };
  const users = useUsers(params);
  const resetPassword = useResetPassword();
  const updateUser = useUpdateUser();

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  async function confirmReset() {
    try {
      const res = await resetPassword.mutateAsync(resetUser.id);
      setTempPassword({ name: resetUser.name, password: res.data.temporary_password });
      setResetUser(null);
    } catch (error) {
      setResetUser(null);
      toast.error(error.message);
    }
  }

  async function confirmToggle() {
    const target = toggleUser;
    try {
      await updateUser.mutateAsync({ id: target.id, name: target.name, email: target.email, role: target.role, is_active: !target.is_active });
      toast.success(target.is_active ? 'Pengguna dinonaktifkan.' : 'Pengguna diaktifkan kembali.');
    } catch (error) {
      toast.error(error.message);
    }
    setToggleUser(null);
  }

  const columns = [
    {
      key: 'name',
      header: 'Nama',
      render: (row) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-medium text-ink">
            {row.name}
            {row.id === me.id ? <Badge tone="primary">Anda</Badge> : null}
          </div>
          <div className="truncate text-xs font-normal text-muted">{row.email}</div>
        </div>
      ),
    },
    { key: 'role', header: 'Peran', render: (row) => ROLE_LABELS[row.role] },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge kind="user" status={row.is_active ? 'active' : 'inactive'} /> },
    {
      key: 'last_login_at',
      header: 'Login terakhir',
      render: (row) => (row.last_login_at ? formatDateTime(row.last_login_at) : <span className="text-muted">Belum pernah</span>),
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Ubah" onClick={() => setFormUser(row)} />
          <IconButton icon={KeyRound} label="Reset password" onClick={() => setResetUser(row)} />
          {row.id !== me.id ? (
            row.is_active ? (
              <IconButton icon={UserX} label="Nonaktifkan" variant="danger" onClick={() => setToggleUser(row)} />
            ) : (
              <IconButton icon={UserCheck} label="Aktifkan" onClick={() => setToggleUser(row)} />
            )
          ) : null}
        </div>
      ),
    },
  ];

  const hasFilter = Boolean(search || role || isActive);

  return (
    <>
      <PageHeader
        title="Pengguna"
        subtitle="Kelola akun dan peran pengguna aplikasi."
        actions={
          <Button leftIcon={Plus} onClick={() => setFormUser(null)}>
            Tambah Pengguna
          </Button>
        }
      />

      <FilterBar>
        <SearchInput value={search} onChange={changeFilter(setSearch)} placeholder="Cari nama atau email…" />
        <div className="w-full sm:w-44">
          <Select value={role} onChange={changeFilter(setRole)} options={ROLE_FILTER} />
        </div>
        <div className="w-full sm:w-44">
          <Select value={isActive} onChange={changeFilter(setIsActive)} options={STATUS_FILTER} />
        </div>
      </FilterBar>

      {users.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={users.error.message} onRetry={() => users.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={users.data?.data ?? []}
            loading={users.isLoading}
            emptyState={
              <EmptyState
                icon={Users}
                title={hasFilter ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'}
                description={hasFilter ? 'Coba ubah kata kunci atau filter.' : undefined}
              />
            }
          />
          <Pagination meta={users.data?.meta} onPageChange={setPage} />
        </>
      )}

      {formUser !== undefined ? (
        <UserFormModal key={formUser?.id ?? 'new'} open onClose={() => setFormUser(undefined)} user={formUser} isSelf={formUser?.id === me.id} />
      ) : null}

      <ConfirmDialog
        open={Boolean(resetUser)}
        onClose={() => setResetUser(null)}
        onConfirm={confirmReset}
        loading={resetPassword.isPending}
        title="Reset password?"
        message={resetUser ? `Password ${resetUser.name} akan diganti dengan password sementara dan semua sesi login-nya akan keluar.` : ''}
        confirmLabel="Ya, reset"
        tone="danger"
      />

      <ConfirmDialog
        open={Boolean(toggleUser)}
        onClose={() => setToggleUser(null)}
        onConfirm={confirmToggle}
        loading={updateUser.isPending}
        title={toggleUser?.is_active ? 'Nonaktifkan pengguna?' : 'Aktifkan pengguna?'}
        message={
          toggleUser?.is_active
            ? `${toggleUser.name} tidak akan bisa masuk lagi dan semua sesi login-nya akan keluar.`
            : `${toggleUser?.name ?? ''} akan bisa masuk kembali.`
        }
        confirmLabel={toggleUser?.is_active ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
        tone={toggleUser?.is_active ? 'danger' : 'primary'}
      />

      <TemporaryPasswordModal
        open={Boolean(tempPassword)}
        onClose={() => setTempPassword(null)}
        userName={tempPassword?.name}
        password={tempPassword?.password}
      />
    </>
  );
}
