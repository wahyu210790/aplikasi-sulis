// src/utils.js
// Simple helper utilities for formatting currency and percentages
export const formatRupiah = (value) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
};

export const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (isNaN(num)) return '-';
  return `${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}%`;
};

/** Format quantity with id-ID locale without trailing zeroes (e.g. 1.000 -> 1, 1.500 -> 1,5, 1250 -> 1.250) */
export const formatQuantity = (value) => {
  if (value === null || value === undefined) return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(num);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Render a clean page header section */
export const renderPageHeader = (title, subtitle = '', actionHtml = '') => {
  return `
    <div class="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-200/80">
      <div>
        <h1 class="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900">${title}</h1>
        ${subtitle ? `<p class="text-xs sm:text-sm text-slate-500 mt-1">${subtitle}</p>` : ''}
      </div>
      ${actionHtml ? `<div class="flex items-center gap-2 shrink-0 w-full sm:w-auto flex-wrap sm:flex-nowrap">${actionHtml}</div>` : ''}
    </div>`;
};

/** Render consistent UI status pills/badges */
export const renderBadge = (status) => {
  if (!status) return '-';
  const s = String(status).toUpperCase();
  let colorStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  
  if (['CONFIRMED', 'COMPLETED', 'FINISHED', 'SUCCESS', 'ACTIVE', 'PURCHASE_IN', 'ADJUSTMENT_IN'].includes(s)) {
    colorStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
  } else if (['DRAFT', 'PENDING', 'WARNING', 'STOCK_OUT'].includes(s)) {
    colorStyle = 'bg-amber-50 text-amber-700 border-amber-200/80';
  } else if (['CANCELLED', 'FAILED', 'REJECTED', 'DANGER', 'ADJUSTMENT_OUT'].includes(s)) {
    colorStyle = 'bg-rose-50 text-rose-700 border-rose-200/80';
  } else if (['PROJECT_USAGE'].includes(s)) {
    colorStyle = 'bg-blue-50 text-blue-700 border-blue-200/80';
  }

  const labelMap = {
    PURCHASE_IN: 'Pembelian Masuk',
    PROJECT_USAGE: 'Penggunaan Project',
    STOCK_OUT: 'Stock Keluar',
    ADJUSTMENT_IN: 'Penyesuaian (+)',
    ADJUSTMENT_OUT: 'Penyesuaian (-)',
  };

  const label = labelMap[s] || s;

  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorStyle}">${label}</span>`;
};

/** Render skeleton or loading state */
export const renderLoadingState = (message = 'Memuat data...') => {
  return `
    <div class="flex flex-col items-center justify-center py-16 px-4">
      <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm font-medium text-slate-500">${message}</p>
    </div>`;
};

/** Render elegant empty state */
export const renderEmptyStateUI = (title = 'Belum Ada Data', message = 'Tidak ada catatan atau item yang dapat ditampilkan.') => {
  return `
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-slate-200/80 shadow-sm my-4">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
      </div>
      <h3 class="text-base font-semibold text-slate-800">${title}</h3>
      <p class="text-sm text-slate-500 mt-1 max-w-sm">${message}</p>
    </div>`;
};

/** Render clean error state */
export const renderErrorState = (message = 'Gagal memuat data', retryCallback) => {
  return `
    <div class="p-6 bg-rose-50/80 border border-rose-200/80 rounded-2xl text-center max-w-md mx-auto my-6">
      <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 inline-flex items-center justify-center mb-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h3 class="text-base font-bold text-rose-900 mb-1">Gagal Memuat Data</h3>
      <p class="text-xs text-rose-700 mb-2">${message}</p>
      ${retryCallback ? `<button id="retryStateBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all mt-2">Coba Lagi</button>` : ''}
    </div>`;
};

/** Render consistent access denied state */
export const renderAccessDeniedUI = (title = 'Akses Ditolak', message = 'Anda tidak memiliki izin untuk mengakses halaman ini.') => {
  return `
    <div class="p-8 bg-white border border-slate-200/80 rounded-2xl text-center max-w-md mx-auto my-8 shadow-sm">
      <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 inline-flex items-center justify-center mb-3 border border-amber-200/60 mx-auto">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>
      <h3 class="text-lg font-bold text-slate-900 mb-1 font-poppins">${title}</h3>
      <p class="text-xs text-slate-500 mb-4">${message}</p>
    </div>`;
};
/** Render consistent pagination controls */
export const createDebounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

export const renderPagination = (meta) => {
  if (!meta || meta.total === 0) return '';
  const currentPage = meta.current_page || 1;
  const lastPage = meta.last_page || 1;
  const total = meta.total || 0;
  const from = meta.from || (currentPage - 1) * (meta.per_page || 15) + 1;
  const to = meta.to || Math.min(currentPage * (meta.per_page || 15), total);

  return `
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
      <div>
        Menampilkan <span class="font-semibold text-slate-800 font-mono">${total > 0 ? from : 0}</span> - <span class="font-semibold text-slate-800 font-mono">${to}</span> dari <span class="font-semibold text-slate-800 font-mono">${total}</span> item
      </div>
      <div class="flex items-center gap-1.5">
        <button data-page="${currentPage - 1}" class="pagination-btn px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs" ${currentPage <= 1 ? 'disabled' : ''}>
          &larr; Sebelumnya
        </button>
        <span class="px-3 py-1.5 font-mono text-slate-700 font-medium">Halaman ${currentPage} / ${lastPage}</span>
        <button data-page="${currentPage + 1}" class="pagination-btn px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs" ${currentPage >= lastPage ? 'disabled' : ''}>
          Berikutnya &rarr;
        </button>
      </div>
    </div>`;
};


