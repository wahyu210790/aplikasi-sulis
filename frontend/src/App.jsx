import { Routes, Route, Link } from 'react-router';
import { formatDateTime, formatRupiah } from './lib/format.js';

// TEMPORARY page for T1.07 only. T1.10 replaces this whole file.
function FoundationPage() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <div className="rounded-card border border-line bg-surface p-5 shadow-sm">
        <h1 className="text-2xl font-semibold">Fondasi frontend siap</h1>
        <p className="mt-2 text-sm text-muted">Contoh format: {formatRupiah(1322500)} · {formatDateTime('2026-10-26T15:30:00+07:00')}</p>
        <button type="button" className="mt-4 rounded-control bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          Tombol contoh
        </button>
      </div>
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="mx-auto max-w-xl p-6 text-center">
      <h1 className="text-2xl font-semibold">Halaman tidak ditemukan</h1>
      <Link to="/" className="mt-4 inline-block text-primary hover:underline">Kembali ke beranda</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FoundationPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
