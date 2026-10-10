import { apiClient } from './api.js';
import { formatRupiah, renderPageHeader, renderBadge, renderLoadingState, renderEmptyStateUI } from './utils.js';

function renderLoading() {
  const main = document.getElementById('mainContent');
  if (!main) return;
  main.innerHTML = renderLoadingState('Memuat Dashboard Warehouse...');
}

function renderError(message, retryCallback) {
  const main = document.getElementById('mainContent');
  if (!main) return;
  main.innerHTML = `
    <div class="p-6 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md my-6">
      <div class="flex items-center gap-3 text-rose-600 mb-2">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3 class="font-semibold text-sm">Gagal Memuat Data</h3>
      </div>
      <p class="text-xs text-slate-600 mb-4">${message}</p>
      <button id="retryBtn" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all">Coba Lagi</button>
    </div>`;
  const retryBtn = document.getElementById('retryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', retryCallback);
  }
}

function statCard(label, value, hint = '', badgeColor = 'bg-blue-50 text-blue-700 border-blue-200') {
  return `
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">${label}</span>
          ${hint ? `<span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeColor}">${hint}</span>` : ''}
        </div>
        <div class="font-heading text-2xl font-bold text-slate-900 tracking-tight">${value}</div>
      </div>
    </div>`;
}

function renderDashboard(data) {
  const main = document.getElementById('mainContent');
  if (!main) return;

  const headerHtml = renderPageHeader(
    'Warehouse Operations Dashboard',
    'Kelola stok fisik, pergerakan barang masuk/keluar, dan sesi stock opname.'
  );

  const kpiHtml = `
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      ${statCard('Total Produk', data.total_products, 'Catalog')}
      ${statCard('Total Kuantitas Fisik', data.total_quantity, 'Total Units')}
      ${statCard('Estimasi Nilai Persediaan', formatRupiah(data.total_stock_value), 'Valuation', 'bg-emerald-50 text-emerald-700 border-emerald-200')}
    </div>`;

  const movementsSection = data.recent_stock_movements && data.recent_stock_movements.length
    ? `<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Aktivitas Inventory Terbaru</h3>
          <a href="#/inventory" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Tanggal</th>
                <th class="px-5 py-3">Produk</th>
                <th class="px-5 py-3">Tipe Pergerakan</th>
                <th class="px-5 py-3 text-right">Kuantitas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${data.recent_stock_movements.map(m => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-slate-500">${new Date(m.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td class="px-5 py-3 font-medium text-slate-900">${m.product?.name || '-'}</td>
                  <td class="px-5 py-3">${renderBadge(m.type)}</td>
                  <td class="px-5 py-3 text-right font-semibold text-slate-900">${m.quantity}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`
    : renderEmptyStateUI('Aktivitas Inventory Terbaru', 'Belum ada mutasi persediaan.');

  const opnamesSection = data.recent_stock_opnames && data.recent_stock_opnames.length
    ? `<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Stock Opname Terbaru</h3>
          <a href="#/stock-opname" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Kelola Opname →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Nomor Sesi</th>
                <th class="px-5 py-3">Tanggal Opname</th>
                <th class="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${data.recent_stock_opnames.map(o => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 font-semibold text-slate-900">${o.opname_number}</td>
                  <td class="px-5 py-3 text-slate-600">${new Date(o.opname_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td class="px-5 py-3">${renderBadge(o.status)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`
    : renderEmptyStateUI('Stock Opname Terbaru', 'Belum ada sesi pencocokan stok fisik.');

  main.innerHTML = `
    <div>
      ${headerHtml}
      ${kpiHtml}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>${movementsSection}</div>
        <div>${opnamesSection}</div>
      </div>
    </div>`;
}

export async function renderWarehouseDashboard() {
  renderLoading();
  try {
    const resp = await apiClient.get('/dashboard/warehouse');
    const data = resp.data ?? resp;
    renderDashboard(data);
  } catch (err) {
    if (err.status === 401) {
      const { clearToken } = await import('./auth.js');
      clearToken();
      window.location.hash = '#/login';
    } else if (err.status === 403) {
      renderError('Akses ditolak (403).', renderWarehouseDashboard);
    } else {
      renderError('Dashboard tidak dapat dimuat.', renderWarehouseDashboard);
    }
  }
}
