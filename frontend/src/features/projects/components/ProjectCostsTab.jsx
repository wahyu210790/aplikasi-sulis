import { useState } from 'react';
import { Pencil, Plus, Receipt, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { EmptyState } from '../../../components/ui/EmptyState.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { formatDate, formatRupiah } from '../../../lib/format.js';
import { useDeleteProjectCost, useProjectCosts } from '../api.js';
import { ProjectCostFormModal } from './ProjectCostFormModal.jsx';

// "Biaya Lain" tab (B3.9): Owner/Finance add, edit and delete other costs. Every change is audit-logged by the API.
export function ProjectCostsTab({ projectId, canManage }) {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [formItem, setFormItem] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleteItem, setDeleteItem] = useState(null);
  const costs = useProjectCosts(projectId, { page, per_page: 20 });
  const remove = useDeleteProjectCost(projectId);

  async function confirmDelete() {
    try {
      await remove.mutateAsync(deleteItem.id);
      toast.success('Biaya dihapus.');
    } catch (error) {
      toast.error(error.message);
    }
    setDeleteItem(null);
  }

  const columns = [
    { key: 'description', header: 'Keterangan', render: (row) => <span className="font-medium break-words text-ink">{row.description}</span> },
    { key: 'cost_date', header: 'Tanggal', render: (row) => formatDate(row.cost_date) },
    { key: 'amount', header: 'Jumlah', align: 'right', render: (row) => <Money value={row.amount} /> },
    {
      key: 'created_by',
      header: 'Dicatat oleh',
      render: (row) => (
        <div className="text-sm">
          <div>{row.created_by?.name ?? '–'}</div>
          {row.updated_by ? <div className="text-xs text-muted">Diubah oleh {row.updated_by.name}</div> : null}
        </div>
      ),
    },
  ];
  if (canManage) {
    columns.push({
      key: 'actions',
      header: 'Aksi',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-1">
          <IconButton icon={Pencil} label="Ubah" onClick={() => setFormItem(row)} />
          <IconButton icon={Trash2} label="Hapus" variant="danger" onClick={() => setDeleteItem(row)} />
        </div>
      ),
    });
  }

  return (
    <div className="space-y-3">
      {canManage ? (
        <div className="flex justify-end">
          <Button leftIcon={Plus} onClick={() => setFormItem(null)}>
            Tambah Biaya
          </Button>
        </div>
      ) : null}

      {costs.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={costs.error.message} onRetry={() => costs.refetch()} />
        </div>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={costs.data?.data ?? []}
            loading={costs.isLoading}
            emptyState={
              <EmptyState icon={Receipt} title="Belum ada biaya lain" description="Catat biaya selain material, misalnya upah tukang atau sewa alat." />
            }
          />
          <Pagination meta={costs.data?.meta} onPageChange={setPage} />
        </>
      )}

      {formItem !== undefined ? (
        <ProjectCostFormModal key={formItem?.id ?? 'new'} open onClose={() => setFormItem(undefined)} projectId={projectId} cost={formItem} />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        loading={remove.isPending}
        title="Hapus biaya?"
        message={deleteItem ? `Biaya "${deleteItem.description}" sebesar ${formatRupiah(deleteItem.amount)} akan dihapus dan laba proyek dihitung ulang.` : ''}
        confirmLabel="Ya, hapus"
        tone="danger"
      />
    </div>
  );
}
