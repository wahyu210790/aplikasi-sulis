// src/reports.js
/*
  Reports UI module.
  Provides tabs for various reports with role‑based access.
  Uses existing apiClient and utils for formatting.
*/
import { apiClient } from './api.js';
import { 
  formatRupiah, 
  formatPercent, 
  renderPageHeader, 
  renderBadge, 
  renderLoadingState, 
  renderEmptyStateUI, 
  renderErrorState, 
  renderAccessDeniedUI,
  renderPagination,
  createDebounce
} from './utils.js';

// Report definitions with required roles and endpoints
const REPORTS = [
  {
    id: 'inventory',
    label: 'Ringkasan Persediaan',
    endpoint: '/reports/inventory-summary',
    roles: ['owner', 'warehouse'],
    render: renderInventorySummary,
  },
  {
    id: 'stockMovements',
    label: 'Pergerakan Stok',
    endpoint: '/reports/stock-movements',
    roles: ['owner', 'finance', 'warehouse'],
    render: renderStockMovements,
  },
  {
    id: 'purchase',
    label: 'Ringkasan Pembelian',
    endpoint: '/reports/purchase-summary',
    roles: ['owner', 'finance'],
    render: renderPurchaseSummary,
  },
  {
    id: 'projectProfit',
    label: 'Profitabilitas Proyek',
    endpoint: '/reports/project-profitability',
    roles: ['owner', 'finance'],
    render: renderProjectProfitability,
  },
  {
    id: 'financial',
    label: 'Financial Overview',
    endpoint: '/reports/financial-overview',
    roles: ['owner', 'finance'],
    render: renderFinancialOverview,
  },
  {
    id: 'projectCost',
    label: 'Detail Biaya Proyek',
    endpoint: '/reports/projects',
    roles: ['owner', 'finance'],
    render: renderProjectCostDetail,
  },
];

export async function renderReports(container, fullRoute = '/reports') {
  if (!container) return;
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const role = user.role || '';

  const available = REPORTS.filter(r => r.roles.includes(role));
  if (available.length === 0) {
    container.innerHTML = renderAccessDeniedUI(
      'Modul Laporan',
      'Peran Anda tidak memiliki izin untuk melihat laporan ini.'
    );
    return;
  }

  const headerHtml = renderPageHeader(
    'Modul Laporan & Financial Reporting',
    'Pantau analisis persediaan, mutasi pergerakan stok barang, histori pembelian supplier, serta analisis profitabilitas proyek.'
  );

  const tabsHtml = `
    <div class="mb-6 flex overflow-x-auto p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner no-scrollbar gap-1 max-w-full">
      ${available.map((r, idx) => `
        <button data-report="${r.id}" class="px-3.5 sm:px-4 py-2.5 sm:py-2 whitespace-nowrap rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 min-h-[40px] shrink-0 ${idx === 0 ? 'bg-white text-blue-600 font-semibold shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'}">
          ${r.label}
        </button>
      `).join('')}
    </div>`;

  container.innerHTML = headerHtml + tabsHtml + `<div id="reportContent"></div>`;
  const contentEl = container.querySelector('#reportContent');

  container.querySelectorAll('button[data-report]').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelectorAll('button[data-report]').forEach(b => {
        b.className = 'px-4 py-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60';
      });
      btn.className = 'px-4 py-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80';

      const rid = btn.getAttribute('data-report');
      const def = REPORTS.find(r => r.id === rid);
      if (def) await def.render(contentEl);
    });
  });

  // Default to first available report
  const firstBtn = container.querySelector('button[data-report]');
  if (firstBtn) firstBtn.click();
}

// ----- Individual Report Renderers -----

async function renderInventorySummary(target) {
  target.innerHTML = renderLoadingState('Memuat ringkasan persediaan...');
  async function load() {
    try {
      const resp = await apiClient.get('/reports/inventory-summary');
      const data = resp.data ?? resp;
      const { total_products, total_quantity, total_value, zero_stock, low_stock } = data;

      if ([total_products, total_quantity, total_value, zero_stock, low_stock].every(v => v == null)) {
        target.innerHTML = renderEmptyStateUI('Tidak Ada Data', 'Ringkasan persediaan kosong.');
        return;
      }

      target.innerHTML = `
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Produk</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${total_products ?? 0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Item terdaftar</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Kuantitas</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${total_quantity ?? 0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Total unit stok</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Nilai Persediaan</span>
              <span class="text-2xl font-bold text-blue-600 font-mono block mt-1">${formatRupiah(total_value)}</span>
              <span class="text-xs text-slate-500 mt-1 block">Moving average value</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Stok Habis (Zero)</span>
              <span class="text-2xl font-bold text-rose-600 font-mono block mt-1">${zero_stock ?? 0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Produk 0 unit</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Stok Menipis</span>
              <span class="text-2xl font-bold text-amber-600 font-mono block mt-1">${low_stock ?? 0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Di bawah minimum</span>
            </div>
          </div>
        </div>`;
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat Ringkasan Inventaris.';
      target.innerHTML = renderErrorState(msg, load);
    }
  }
  await load();
}

async function renderStockMovements(target) {
  let state = {
    search: '',
    type: '',
    project_id: '',
    date_from: '',
    date_to: '',
    sort: 'transaction_date',
    direction: 'desc',
    page: 1,
  };

  let projects = [];
  try {
    const projResp = await apiClient.get('/projects?per_page=100');
    projects = Array.isArray(projResp.data) ? projResp.data : (Array.isArray(projResp) ? projResp : []);
  } catch (e) {}

  const projectOptions = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  target.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari produk / kode..." value="${state.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>

          <select id="typeSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Tipe Movement</option>
            <option value="PURCHASE_IN">PURCHASE_IN</option>
            <option value="PROJECT_USAGE">PROJECT_USAGE</option>
            <option value="STOCK_OUT">STOCK_OUT</option>
            <option value="ADJUSTMENT_IN">ADJUSTMENT_IN</option>
            <option value="ADJUSTMENT_OUT">ADJUSTMENT_OUT</option>
          </select>

          <select id="projectSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Proyek</option>
            ${projectOptions}
          </select>

          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="transaction_date-desc">Urut: Tanggal (Terbaru)</option>
            <option value="transaction_date-asc">Urut: Tanggal (Terlama)</option>
            <option value="quantity-desc">Urut: Qty (Terbanyak)</option>
            <option value="total_cost-desc">Urut: Total Cost (Tertinggi)</option>
          </select>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">Periode:</label>
            <input type="date" id="dateFromInput" value="${state.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${state.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
          </div>

          <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Reset Filter
          </button>
        </div>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="reportMovementsTableContainer"></div>
    </div>`;

  const tableContainer = target.querySelector('#reportMovementsTableContainer');
  const dateErr = target.querySelector('#dateValidationError');

  const loadData = async () => {
    if (state.date_from && state.date_to && state.date_from > state.date_to) {
      dateErr.classList.remove('hidden');
      return;
    }
    dateErr.classList.add('hidden');

    tableContainer.innerHTML = renderLoadingState('Memuat pergerakan stok...');
    try {
      const queryParams = new URLSearchParams();
      if (state.search) queryParams.append('search', state.search);
      if (state.type) queryParams.append('type', state.type);
      if (state.project_id) queryParams.append('project_id', state.project_id);
      if (state.date_from) queryParams.append('date_from', state.date_from);
      if (state.date_to) queryParams.append('date_to', state.date_to);
      if (state.sort) queryParams.append('sort', state.sort);
      if (state.direction) queryParams.append('direction', state.direction);
      queryParams.append('page', state.page);
      queryParams.append('per_page', 15);

      const resp = await apiClient.get(`/reports/stock-movements?${queryParams.toString()}`);
      const data = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      if (data.length === 0) {
        target.querySelector('#reportMovementsTableContainer').innerHTML = renderEmptyStateUI('Tidak Ada Data', 'Tidak ada pergerakan stok yang sesuai kriteria pencarian.');
        return;
      }

      const rows = data.map(m => {
        let badgeType = 'info';
        if (m.type === 'PURCHASE_IN') badgeType = 'success';
        else if (m.type === 'PROJECT_USAGE') badgeType = 'warning';
        else if (m.type === 'STOCK_OUT') badgeType = 'danger';

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3 font-mono text-xs font-semibold text-slate-500">#${m.id ?? '-'}</td>
            <td class="px-5 py-3 text-sm text-slate-600">${m.date ?? '-'}</td>
            <td class="px-5 py-3 text-sm font-medium text-slate-800">${m.product?.name ?? '-'}</td>
            <td class="px-5 py-3 text-sm">${renderBadge(m.type ?? 'MOV', badgeType)}</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${m.quantity ?? '-'}</td>
            <td class="px-5 py-3 text-sm font-mono text-right text-slate-600">${formatRupiah(m.unit_cost)}</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(m.total_cost)}</td>
            <td class="px-5 py-3 text-sm text-slate-600">${m.project?.name ?? '-'}</td>
            <td class="px-5 py-3 text-sm text-slate-600">${m.created_by?.name ?? '-'}</td>
          </tr>`;
      }).join('');

      const paginationHtml = renderPagination(resp);

      tableContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th class="px-5 py-3">ID</th>
                  <th class="px-5 py-3">Tanggal</th>
                  <th class="px-5 py-3">Produk</th>
                  <th class="px-5 py-3">Tipe Movement</th>
                  <th class="px-5 py-3 text-right">Qty</th>
                  <th class="px-5 py-3 text-right">Unit Cost</th>
                  <th class="px-5 py-3 text-right">Total Cost</th>
                  <th class="px-5 py-3">Proyek</th>
                  <th class="px-5 py-3">User</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${rows}</tbody>
            </table>
          </div>
          ${paginationHtml}
        </div>`;

      tableContainer.querySelectorAll('.pagination-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const targetPage = parseInt(btn.getAttribute('data-page'));
          if (targetPage && targetPage !== state.page) {
            state.page = targetPage;
            loadData();
          }
        });
      });

    } catch (err) {
      tableContainer.innerHTML = renderErrorState(`Gagal memuat Pergerakan Stok.`, () => loadData());
    }
  };

  const debouncedSearch = createDebounce((val) => {
    state.search = val;
    state.page = 1;
    loadData();
  }, 300);

  target.querySelector('#searchInput').addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

  target.querySelector('#typeSelect').addEventListener('change', (e) => {
    state.type = e.target.value;
    state.page = 1;
    loadData();
  });

  target.querySelector('#projectSelect').addEventListener('change', (e) => {
    state.project_id = e.target.value;
    state.page = 1;
    loadData();
  });

  target.querySelector('#sortSelect').addEventListener('change', (e) => {
    const [sort, dir] = e.target.value.split('-');
    state.sort = sort;
    state.direction = dir;
    state.page = 1;
    loadData();
  });

  target.querySelector('#dateFromInput').addEventListener('change', (e) => {
    state.date_from = e.target.value;
    state.page = 1;
    loadData();
  });

  target.querySelector('#dateToInput').addEventListener('change', (e) => {
    state.date_to = e.target.value;
    state.page = 1;
    loadData();
  });

  target.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.search = '';
    state.type = '';
    state.project_id = '';
    state.date_from = '';
    state.date_to = '';
    state.sort = 'transaction_date';
    state.direction = 'desc';
    state.page = 1;

    target.querySelector('#searchInput').value = '';
    target.querySelector('#typeSelect').value = '';
    target.querySelector('#projectSelect').value = '';
    target.querySelector('#sortSelect').value = 'transaction_date-desc';
    target.querySelector('#dateFromInput').value = '';
    target.querySelector('#dateToInput').value = '';

    loadData();
  });

  await loadData();
}

async function renderPurchaseSummary(target) {
  let state = {
    supplier_id: '',
    status: '',
    date_from: '',
    date_to: '',
  };

  let suppliers = [];
  try {
    const supResp = await apiClient.get('/suppliers?per_page=100');
    suppliers = Array.isArray(supResp.data) ? supResp.data : (Array.isArray(supResp) ? supResp : []);
  } catch (e) {}

  const supplierOptions = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  target.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex-1 flex flex-wrap items-center gap-3">
          <select id="supplierSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Supplier</option>
            ${supplierOptions}
          </select>
          <select id="statusSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500">Periode:</label>
            <input type="date" id="dateFromInput" value="${state.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${state.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
          </div>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="purchaseSummaryContent"></div>
    </div>`;

  const contentContainer = target.querySelector('#purchaseSummaryContent');
  const dateErr = target.querySelector('#dateValidationError');

  const loadData = async () => {
    if (state.date_from && state.date_to && state.date_from > state.date_to) {
      dateErr.classList.remove('hidden');
      return;
    }
    dateErr.classList.add('hidden');

    contentContainer.innerHTML = renderLoadingState('Memuat ringkasan pembelian...');
    try {
      const queryParams = new URLSearchParams();
      if (state.supplier_id) queryParams.append('supplier_id', state.supplier_id);
      if (state.status) queryParams.append('status', state.status);
      if (state.date_from) queryParams.append('date_from', state.date_from);
      if (state.date_to) queryParams.append('date_to', state.date_to);

      const resp = await apiClient.get(`/reports/purchase-summary?${queryParams.toString()}`);
      const data = resp.data ?? resp;
      const { total_purchases, total_amount, total_quantity, by_status, by_supplier } = data;

      if (total_purchases == null && total_amount == null) {
        contentContainer.innerHTML = renderEmptyStateUI('Tidak Ada Data', 'Tidak ada data ringkasan purchase.');
        return;
      }

      let statusTableRows = '';
      if (Array.isArray(by_status) && by_status.length) {
        statusTableRows = by_status.map(s => {
          let bType = 'neutral';
          if (s.status === 'CONFIRMED') bType = 'success';
          else if (s.status === 'DRAFT') bType = 'warning';
          else if (s.status === 'CANCELLED') bType = 'danger';

          return `
            <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
              <td class="px-5 py-3 text-sm">${renderBadge(s.status ?? '-', bType)}</td>
              <td class="px-5 py-3 text-sm font-mono text-slate-700">${s.count ?? 0} transaksi</td>
              <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(s.amount)}</td>
            </tr>`;
        }).join('');
      }

      let supplierTableRows = '';
      if (Array.isArray(by_supplier) && by_supplier.length) {
        supplierTableRows = by_supplier.map(s => `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3 text-sm font-medium text-slate-800">${s.supplier_name ?? '-'}</td>
            <td class="px-5 py-3 text-sm font-mono text-slate-700">${s.count ?? 0} transaksi</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(s.amount)}</td>
          </tr>`).join('');
      }

      contentContainer.innerHTML = `
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Purchases</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${total_purchases ?? 0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Total pesanan pembelian</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Nominal Pembelian</span>
              <span class="text-2xl font-bold text-blue-600 font-mono block mt-1">${formatRupiah(total_amount)}</span>
              <span class="text-xs text-slate-500 mt-1 block">Nilai transaksi pembelian</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Kuantitas Barang</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${total_quantity ?? 0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Unit barang dipesan</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${statusTableRows ? `
              <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Berdasarkan Status Transaksi</h4>
                <div class="rounded-xl border border-slate-200/80 overflow-hidden">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th class="px-5 py-3">Status</th>
                        <th class="px-5 py-3">Jumlah</th>
                        <th class="px-5 py-3 text-right">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">${statusTableRows}</tbody>
                  </table>
                </div>
              </div>` : ''}

            ${supplierTableRows ? `
              <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Berdasarkan Supplier</h4>
                <div class="rounded-xl border border-slate-200/80 overflow-hidden">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th class="px-5 py-3">Nama Supplier</th>
                        <th class="px-5 py-3">Jumlah PO</th>
                        <th class="px-5 py-3 text-right">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">${supplierTableRows}</tbody>
                  </table>
                </div>
              </div>` : ''}
          </div>
        </div>`;
    } catch (err) {
      contentContainer.innerHTML = renderErrorState(`Gagal memuat Ringkasan Pembelian.`, loadData);
    }
  };

  target.querySelector('#supplierSelect').addEventListener('change', (e) => {
    state.supplier_id = e.target.value;
    loadData();
  });

  target.querySelector('#statusSelect').addEventListener('change', (e) => {
    state.status = e.target.value;
    loadData();
  });

  target.querySelector('#dateFromInput').addEventListener('change', (e) => {
    state.date_from = e.target.value;
    loadData();
  });

  target.querySelector('#dateToInput').addEventListener('change', (e) => {
    state.date_to = e.target.value;
    loadData();
  });

  target.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.supplier_id = '';
    state.status = '';
    state.date_from = '';
    state.date_to = '';

    target.querySelector('#supplierSelect').value = '';
    target.querySelector('#statusSelect').value = '';
    target.querySelector('#dateFromInput').value = '';
    target.querySelector('#dateToInput').value = '';

    loadData();
  });

  await loadData();
}

async function renderProjectProfitability(target) {
  let state = {
    project_id: '',
    status: '',
    date_from: '',
    date_to: '',
  };

  let projects = [];
  try {
    const projResp = await apiClient.get('/projects?per_page=100');
    projects = Array.isArray(projResp.data) ? projResp.data : (Array.isArray(projResp) ? projResp : []);
  } catch (e) {}

  const projectOptions = projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');

  target.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex-1 flex flex-wrap items-center gap-3">
          <select id="projectSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Proyek</option>
            ${projectOptions}
          </select>
          <select id="statusSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500">Periode:</label>
            <input type="date" id="dateFromInput" value="${state.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${state.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
          </div>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="profitabilityTableContainer"></div>
    </div>`;

  const tableContainer = target.querySelector('#profitabilityTableContainer');
  const dateErr = target.querySelector('#dateValidationError');

  const loadData = async () => {
    if (state.date_from && state.date_to && state.date_from > state.date_to) {
      dateErr.classList.remove('hidden');
      return;
    }
    dateErr.classList.add('hidden');

    tableContainer.innerHTML = renderLoadingState('Memuat laporan profitabilitas proyek...');
    try {
      const queryParams = new URLSearchParams();
      if (state.project_id) queryParams.append('project_id', state.project_id);
      if (state.status) queryParams.append('status', state.status);
      if (state.date_from) queryParams.append('date_from', state.date_from);
      if (state.date_to) queryParams.append('date_to', state.date_to);

      const resp = await apiClient.get(`/reports/project-profitability?${queryParams.toString()}`);
      const data = resp.data ?? resp;

      if (!Array.isArray(data) || data.length === 0) {
        tableContainer.innerHTML = renderEmptyStateUI('Tidak Ada Data', 'Tidak ada data profitabilitas proyek yang sesuai kriteria.');
        return;
      }

      const rows = data.map(p => {
        const isPos = (p.gross_profit || 0) >= 0;
        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 text-sm font-semibold text-slate-900">${p.project_name ?? '-'}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-800 text-right">${formatRupiah(p.revenue)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-600 text-right">${formatRupiah(p.material_cost)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-600 text-right">${formatRupiah(p.other_expenses)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-800 text-right font-medium">${formatRupiah(p.total_cost)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-right font-bold ${isPos ? 'text-emerald-600' : 'text-rose-600'}">${formatRupiah(p.gross_profit)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-right font-bold ${isPos ? 'text-emerald-600' : 'text-rose-600'}">${formatPercent(p.margin_percent)}</td>
          </tr>`;
      }).join('');

      tableContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th class="px-5 py-3.5">Nama Proyek</th>
                  <th class="px-5 py-3.5 text-right">Revenue</th>
                  <th class="px-5 py-3.5 text-right">Material Cost</th>
                  <th class="px-5 py-3.5 text-right">Other Expenses</th>
                  <th class="px-5 py-3.5 text-right">Total Cost</th>
                  <th class="px-5 py-3.5 text-right">Gross Profit</th>
                  <th class="px-5 py-3.5 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${rows}</tbody>
            </table>
          </div>
        </div>`;
    } catch (err) {
      tableContainer.innerHTML = renderErrorState(`Gagal memuat Profitabilitas Proyek.`, loadData);
    }
  };

  target.querySelector('#projectSelect').addEventListener('change', (e) => {
    state.project_id = e.target.value;
    loadData();
  });

  target.querySelector('#statusSelect').addEventListener('change', (e) => {
    state.status = e.target.value;
    loadData();
  });

  target.querySelector('#dateFromInput').addEventListener('change', (e) => {
    state.date_from = e.target.value;
    loadData();
  });

  target.querySelector('#dateToInput').addEventListener('change', (e) => {
    state.date_to = e.target.value;
    loadData();
  });

  target.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.project_id = '';
    state.status = '';
    state.date_from = '';
    state.date_to = '';

    target.querySelector('#projectSelect').value = '';
    target.querySelector('#statusSelect').value = '';
    target.querySelector('#dateFromInput').value = '';
    target.querySelector('#dateToInput').value = '';

    loadData();
  });

  await loadData();
}

async function renderFinancialOverview(target) {
  let state = {
    date_from: '',
    date_to: '',
  };

  target.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">Periode Tanggal:</label>
            <input type="date" id="dateFromInput" value="${state.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${state.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
          </div>
          <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Reset Filter
          </button>
        </div>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="financialOverviewContent"></div>
    </div>`;

  const container = target.querySelector('#financialOverviewContent');
  const dateErr = target.querySelector('#dateValidationError');

  const loadData = async () => {
    if (state.date_from && state.date_to && state.date_from > state.date_to) {
      dateErr.classList.remove('hidden');
      return;
    } else {
      dateErr.classList.add('hidden');
    }

    container.innerHTML = renderLoadingState('Memuat financial overview...');
    try {
      const params = new URLSearchParams();
      if (state.date_from) params.append('date_from', state.date_from);
      if (state.date_to) params.append('date_to', state.date_to);

      const resp = await apiClient.get(`/reports/financial-overview?${params.toString()}`);
      const data = resp.data ?? resp;
      const { total_purchase, total_project_revenue, total_material_cost, total_other_project_expenses, total_project_cost, gross_profit, margin_percent } = data;

      if (total_purchase == null && total_project_revenue == null) {
        container.innerHTML = renderEmptyStateUI('Tidak Ada Data', 'Tidak ada data overview keuangan.');
        return;
      }

      const isPos = (gross_profit || 0) >= 0;

      container.innerHTML = `
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Purchases</span>
              <span class="text-2xl font-bold text-slate-900 font-mono">${formatRupiah(total_purchase)}</span>
              <span class="text-xs text-slate-500 block mt-1">Pengeluaran pembelian stok</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Project Revenue</span>
              <span class="text-2xl font-bold text-blue-600 font-mono">${formatRupiah(total_project_revenue)}</span>
              <span class="text-xs text-slate-500 block mt-1">Total nilai kontrak proyek</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Project Cost</span>
              <span class="text-2xl font-bold text-slate-900 font-mono">${formatRupiah(total_project_cost)}</span>
              <span class="text-xs text-slate-500 block mt-1">Material + Other Expenses</span>
            </div>

            <div class="${isPos ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-rose-50/60 border-rose-200/60'} border rounded-2xl p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider ${isPos ? 'text-emerald-700' : 'text-rose-700'} block mb-1">Gross Profit & Margin</span>
              <span class="text-2xl font-bold ${isPos ? 'text-emerald-700' : 'text-rose-700'} font-mono">${formatRupiah(gross_profit)}</span>
              <span class="text-xs font-bold ${isPos ? 'text-emerald-600' : 'text-rose-600'} block mt-1">Margin: ${formatPercent(margin_percent)}</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h4 class="text-base font-bold text-slate-900 font-poppins mb-4">Rincian Komponen Keuangan</h4>
            <div class="rounded-xl border border-slate-200/80 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <tbody>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Purchase (Stok Masuk)</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(total_purchase)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Project Revenue</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-blue-600 text-right">${formatRupiah(total_project_revenue)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Material Cost (Pemakaian Stok)</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(total_material_cost)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Other Project Expenses</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(other_expenses ?? total_other_project_expenses)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors bg-slate-50">
                    <td class="px-5 py-3.5 text-sm font-bold text-slate-900">Total Project Cost</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-bold text-slate-900 text-right">${formatRupiah(total_project_cost)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isPos ? 'bg-emerald-50/40' : 'bg-rose-50/40'}">
                    <td class="px-5 py-3.5 text-sm font-bold ${isPos ? 'text-emerald-800' : 'text-rose-800'}">Gross Profit</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-bold ${isPos ? 'text-emerald-700' : 'text-rose-700'} text-right">${formatRupiah(gross_profit)}</td>
                  </tr>
                  <tr class="hover:bg-slate-50/80 transition-colors ${isPos ? 'bg-emerald-50/40' : 'bg-rose-50/40'}">
                    <td class="px-5 py-3.5 text-sm font-bold ${isPos ? 'text-emerald-800' : 'text-rose-800'}">Margin (%)</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-bold ${isPos ? 'text-emerald-700' : 'text-rose-700'} text-right">${formatPercent(margin_percent)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>`;
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat Overview Keuangan.';
      container.innerHTML = renderErrorState(msg, loadData);
    }
  };

  target.querySelector('#dateFromInput').addEventListener('change', (e) => {
    state.date_from = e.target.value;
    loadData();
  });

  target.querySelector('#dateToInput').addEventListener('change', (e) => {
    state.date_to = e.target.value;
    loadData();
  });

  target.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.date_from = '';
    state.date_to = '';
    target.querySelector('#dateFromInput').value = '';
    target.querySelector('#dateToInput').value = '';
    loadData();
  });

  await loadData();
}

async function renderProjectCostDetail(target) {
  target.innerHTML = renderLoadingState('Memuat daftar proyek...');
  async function loadProjects() {
    try {
      const projResp = await apiClient.get('/projects');
      const projects = projResp.data ?? projResp;

      if (!Array.isArray(projects) || projects.length === 0) {
        target.innerHTML = renderEmptyStateUI('Tidak Ada Proyek', 'Tidak ada proyek untuk ditampilkan.');
        return;
      }

      const selectHtml = `
        <div class="space-y-6 max-w-3xl">
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Pilih Proyek Untuk Detail Biaya</label>
              <select id="projectSelect" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                <option value="">-- Pilih Proyek --</option>
                ${projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
              </select>
            </div>
            <div id="costDetailContainer"></div>
          </div>
        </div>`;

      target.innerHTML = selectHtml;
      const sel = document.getElementById('projectSelect');
      const detailContainer = document.getElementById('costDetailContainer');

      sel.addEventListener('change', async () => {
        const pid = sel.value;
        if (pid) await fetchDetail(detailContainer, pid);
        else detailContainer.innerHTML = '';
      });
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat daftar proyek.';
      target.innerHTML = renderErrorState(msg, loadProjects);
    }
  }

  async function fetchDetail(container, projectId) {
    container.innerHTML = renderLoadingState('Memuat detail biaya proyek...');
    try {
      const resp = await apiClient.get(`/reports/projects/${projectId}/cost-detail`);
      const data = resp.data ?? resp;
      const { project_name, revenue, material_cost, other_expenses, total_cost, gross_profit, margin_percent } = data;

      const isPos = (gross_profit || 0) >= 0;

      container.innerHTML = `
        <div class="pt-4 border-t border-slate-100 space-y-4">
          <h4 class="text-lg font-bold text-slate-900 font-poppins">${project_name}</h4>
          <div class="rounded-xl border border-slate-200/80 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <tbody>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-sm font-medium text-slate-700">Revenue (Nilai Kontrak)</td>
                  <td class="px-5 py-3 text-sm font-mono font-semibold text-blue-600 text-right">${formatRupiah(revenue)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-sm font-medium text-slate-700">Material Cost (Stok Barang)</td>
                  <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(material_cost)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-sm font-medium text-slate-700">Other Expenses (Non-Stok)</td>
                  <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(other_expenses)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors bg-slate-50">
                  <td class="px-5 py-3 text-sm font-bold text-slate-900">Total Cost</td>
                  <td class="px-5 py-3 text-sm font-mono font-bold text-slate-900 text-right">${formatRupiah(total_cost)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${isPos ? 'bg-emerald-50/40' : 'bg-rose-50/40'}">
                  <td class="px-5 py-3 text-sm font-bold ${isPos ? 'text-emerald-800' : 'text-rose-800'}">Gross Profit</td>
                  <td class="px-5 py-3 text-sm font-mono font-bold ${isPos ? 'text-emerald-700' : 'text-rose-700'} text-right">${formatRupiah(gross_profit)}</td>
                </tr>
                <tr class="hover:bg-slate-50/80 transition-colors ${isPos ? 'bg-emerald-50/40' : 'bg-rose-50/40'}">
                  <td class="px-5 py-3 text-sm font-bold ${isPos ? 'text-emerald-800' : 'text-rose-800'}">Margin (%)</td>
                  <td class="px-5 py-3 text-sm font-mono font-bold ${isPos ? 'text-emerald-700' : 'text-rose-700'} text-right">${formatPercent(margin_percent)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>`;
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat detail biaya proyek.';
      container.innerHTML = renderErrorState(msg, () => fetchDetail(container, projectId));
    }
  }

  await loadProjects();
}
