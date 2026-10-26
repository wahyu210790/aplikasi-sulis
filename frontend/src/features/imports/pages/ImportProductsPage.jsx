import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Download, FilePlus2, FileSpreadsheet, RefreshCw, SkipForward, Upload } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Card } from '../../../components/ui/Card.jsx';
import { DataTable } from '../../../components/ui/DataTable.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { StatCard } from '../../../components/ui/StatCard.jsx';
import { useToast } from '../../../components/ui/useToast.js';
import { saveBlob } from '../../../lib/download.js';
import { fieldErrors } from '../../../lib/formErrors.js';
import { downloadProductTemplate, useImportProducts } from '../api.js';

const MAX_BYTES = 2 * 1024 * 1024;

const ERROR_COLUMNS = [
  { key: 'row', header: 'Baris', render: (row) => <span className="tabular-nums">{row.row}</span> },
  { key: 'column', header: 'Kolom', render: (row) => <span className="font-mono text-sm">{row.column}</span> },
  { key: 'message', header: 'Kesalahan', render: (row) => <span className="text-danger">{row.message}</span> },
];

export default function ImportProductsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const upload = useImportProducts();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null); // success summary
  const [failure, setFailure] = useState(null); // { message, errors: [{row, column, message}], errorCount }

  async function handleDownload() {
    setDownloading(true);
    try {
      const blob = await downloadProductTemplate();
      saveBlob(blob, 'template-impor-barang.xlsx');
    } catch (error) {
      toast.error(error.message);
    }
    setDownloading(false);
  }

  function handleFile(event) {
    const chosen = event.target.files?.[0] ?? null;
    setResult(null);
    setFailure(null);
    setFileError('');
    if (chosen && !chosen.name.toLowerCase().endsWith('.xlsx')) {
      setFile(null);
      setFileError('File harus berformat .xlsx (Excel).');
      return;
    }
    if (chosen && chosen.size > MAX_BYTES) {
      setFile(null);
      setFileError('Ukuran file maksimal 2 MB.');
      return;
    }
    setFile(chosen);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setResult(null);
    setFailure(null);
    setFileError('');
    if (!file) {
      setFileError('Pilih file Excel terlebih dahulu.');
      return;
    }
    try {
      const response = await upload.mutateAsync(file);
      setResult(response.data);
      toast.success('Impor barang berhasil.');
    } catch (error) {
      if (Array.isArray(error.errors)) {
        setFailure({ message: error.message, errors: error.errors, errorCount: error.data?.error_count ?? error.errors.length });
      } else {
        setFileError(fieldErrors(error).file || error.message);
      }
    }
  }

  const errorRows = failure ? failure.errors.map((e, index) => ({ ...e, id: index })) : [];

  return (
    <>
      <PageHeader
        title="Impor Barang dari Excel"
        subtitle="Tambah atau perbarui banyak barang sekaligus."
        breadcrumb={[{ label: 'Barang', to: '/barang' }, { label: 'Impor Excel' }]}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="1. Unduh template" description="Isi data barang di file template ini.">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              Kolom wajib: <span className="font-medium text-ink">sku, nama, kategori, satuan</span>. Kolom lain: stok_minimum, catatan.
            </li>
            <li>SKU yang sudah ada akan diperbarui. SKU baru akan ditambahkan.</li>
            <li>Kategori dan satuan yang belum ada akan dibuat otomatis.</li>
            <li>Maksimal 2.000 baris dan 2 MB per file.</li>
          </ul>
          <Button variant="secondary" leftIcon={Download} className="mt-4" loading={downloading} onClick={handleDownload}>
            Unduh Template
          </Button>
        </Card>

        <Card title="2. Unggah file" description="Semua baris diperiksa dulu. Jika ada kesalahan, tidak ada data yang disimpan.">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <FormField label="File Excel (.xlsx)" htmlFor="import-file" required error={fileError}>
              <input
                id="import-file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFile}
                className="block w-full text-sm text-ink file:mr-3 file:rounded-control file:border-0 file:bg-primary-soft file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary hover:file:bg-canvas"
              />
            </FormField>
            {file ? (
              <p className="flex items-center gap-2 text-sm text-muted">
                <FileSpreadsheet aria-hidden="true" className="h-4 w-4" />
                {file.name} ({Math.max(1, Math.round(file.size / 1024))} KB)
              </p>
            ) : null}
            <Button type="submit" leftIcon={Upload} loading={upload.isPending}>
              Unggah dan Proses
            </Button>
          </form>
        </Card>
      </div>

      {result ? (
        <Card
          title="Impor berhasil"
          description="Data barang sudah disimpan."
          className="mt-6"
          actions={
            <Button variant="secondary" size="sm" onClick={() => navigate('/barang')}>
              Lihat Daftar Barang
            </Button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Barang baru" value={result.created} icon={FilePlus2} tone="success" />
            <StatCard label="Barang diperbarui" value={result.updated} icon={RefreshCw} tone="info" />
            <StatCard label="Tidak berubah" value={result.skipped} icon={SkipForward} tone="primary" />
          </div>
          {result.categories_created.length > 0 ? (
            <p className="mt-4 text-sm text-ink">
              <span className="font-medium">Kategori baru:</span> {result.categories_created.join(', ')}
            </p>
          ) : null}
          {result.units_created.length > 0 ? (
            <p className="mt-2 text-sm text-ink">
              <span className="font-medium">Satuan baru:</span> {result.units_created.join(', ')}
            </p>
          ) : null}
        </Card>
      ) : null}

      {failure ? (
        <div className="mt-6 space-y-3">
          <div role="alert" className="rounded-card border border-line bg-danger-soft px-4 py-3 text-sm text-danger sm:px-5">
            <p className="font-semibold">Impor gagal</p>
            <p className="mt-1">{failure.message}</p>
            {failure.errorCount > failure.errors.length ? (
              <p className="mt-1">
                Menampilkan {failure.errors.length} kesalahan pertama dari {failure.errorCount}.
              </p>
            ) : null}
          </div>
          <DataTable columns={ERROR_COLUMNS} rows={errorRows} />
        </div>
      ) : null}
    </>
  );
}
