import { apiClient } from './api.js';
import { formatRupiah, renderBadge, renderLoadingState, renderEmptyStateUI, renderPagination, createDebounce } from './utils.js';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
}

export async function renderInventoryMovements(container) {
  if (!container) return;

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

  container.innerHTML = `
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
            <option value="PURCHASE_IN">Pembelian Masuk (PURCHASE_IN)</option>
            <option value="PROJECT_USAGE">Penggunaan Proyek (PROJECT_USAGE)</option>
            <option value="STOCK_OUT">Stok Keluar (STOCK_OUT)</option>
            <option value="ADJUSTMENT_IN">Penyesuaian (+)</option>
            <option value="ADJUSTMENT_OUT">Penyesuaian (-)</option>
          </select>

          <select id="projectSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Proyek</option>
            ${projectOptions}
          </select>

          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="transaction_date-desc">Urut: Tanggal (Terbaru)</option>
            <option value="transaction_date-asc">Urut: Tanggal (Terlama)</option>
            <option value="quantity-desc">Urut: Kuantitas (Terbanyak)</option>
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

      <div id="movementsTableContainer"></div>
    </div>`;

  const tableContainer = container.querySelector('#movementsTableContainer');
  const dateErr = container.querySelector('#dateValidationError');

  const loadData = async () => {
    if (state.date_from && state.date_to && state.date_from > state.date_to) {
      dateErr.classList.remove('hidden');
      return;
    }
    dateErr.classList.add('hidden');

    tableContainer.innerHTML = renderLoadingState('Memuat mutasi pergerakan...');
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
        tableContainer.innerHTML = renderEmptyStateUI('Belum Ada Pergerakan', 'Tidak ada riwayat mutasi stok yang sesuai pencarian.');
        return;
      }

      const rows = data.map(m => {
        const dateStr = formatDate(m.date || m.transaction_date);
        const qty = m.quantity ?? 0;
        const unitCost = formatRupiah(m.unit_cost);
        const totalCost = formatRupiah(m.total_cost);
        const productName = m.product?.name ?? '-';
        const projectName = m.project?.name ?? '-';

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 text-slate-500 font-mono text-[11px]">${dateStr}</td>
            <td class="px-5 py-3.5 font-medium text-slate-900">${productName}</td>
            <td class="px-5 py-3.5">${renderBadge(m.type)}</td>
            <td class="px-5 py-3.5 text-right font-bold text-slate-900">${qty}</td>
            <td class="px-5 py-3.5 text-right font-medium text-slate-700">${unitCost}</td>
            <td class="px-5 py-3.5 text-right font-bold text-slate-900">${totalCost}</td>
            <td class="px-5 py-3.5 text-slate-600 font-medium">${projectName}</td>
          </tr>`;
      }).join('');

      const paginationHtml = renderPagination(resp);

      tableContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Tanggal</th>
                  <th class="px-5 py-3">Produk</th>
                  <th class="px-5 py-3">Tipe Movement</th>
                  <th class="px-5 py-3 text-right">Kuantitas</th>
                  <th class="px-5 py-3 text-right">Unit Cost</th>
                  <th class="px-5 py-3 text-right">Total Cost</th>
                  <th class="px-5 py-3">Proyek</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">${rows}</tbody>
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
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat pergerakan.';
      tableContainer.innerHTML = `<div class="p-6 text-center text-xs text-rose-600">${msg}</div>`;
    }
  };

  const debouncedSearch = createDebounce((val) => {
    state.search = val;
    state.page = 1;
    loadData();
  }, 300);

  container.querySelector('#searchInput').addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

  container.querySelector('#typeSelect').addEventListener('change', (e) => {
    state.type = e.target.value;
    state.page = 1;
    loadData();
  });

  container.querySelector('#projectSelect').addEventListener('change', (e) => {
    state.project_id = e.target.value;
    state.page = 1;
    loadData();
  });

  container.querySelector('#sortSelect').addEventListener('change', (e) => {
    const [sort, dir] = e.target.value.split('-');
    state.sort = sort;
    state.direction = dir;
    state.page = 1;
    loadData();
  });

  container.querySelector('#dateFromInput').addEventListener('change', (e) => {
    state.date_from = e.target.value;
    state.page = 1;
    loadData();
  });

  container.querySelector('#dateToInput').addEventListener('change', (e) => {
    state.date_to = e.target.value;
    state.page = 1;
    loadData();
  });

  container.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.search = '';
    state.type = '';
    state.project_id = '';
    state.date_from = '';
    state.date_to = '';
    state.sort = 'transaction_date';
    state.direction = 'desc';
    state.page = 1;

    container.querySelector('#searchInput').value = '';
    container.querySelector('#typeSelect').value = '';
    container.querySelector('#projectSelect').value = '';
    container.querySelector('#sortSelect').value = 'transaction_date-desc';
    container.querySelector('#dateFromInput').value = '';
    container.querySelector('#dateToInput').value = '';

    loadData();
  });

  loadData();
}
