import { apiClient } from './api.js';
import { renderLoadingState, renderEmptyStateUI, renderPagination, createDebounce } from './utils.js';

export async function renderSuppliers(container) {
  let state = {
    search: '',
    sort: 'name',
    direction: 'asc',
    page: 1,
  };

  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nama atau kode supplier..." value="${state.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="name-asc">Urut: Nama (A-Z)</option>
            <option value="name-desc">Urut: Nama (Z-A)</option>
            <option value="code-asc">Urut: Kode (Asc)</option>
            <option value="created_at-desc">Urut: Terbaru</option>
          </select>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="suppliersTableContainer"></div>
    </div>`;

  const tableContainer = container.querySelector('#suppliersTableContainer');

  const loadData = async () => {
    tableContainer.innerHTML = renderLoadingState('Memuat data supplier...');
    try {
      const queryParams = new URLSearchParams();
      if (state.search) queryParams.append('search', state.search);
      if (state.sort) queryParams.append('sort', state.sort);
      if (state.direction) queryParams.append('direction', state.direction);
      queryParams.append('page', state.page);
      queryParams.append('per_page', 15);

      const resp = await apiClient.get(`/suppliers?${queryParams.toString()}`);
      const data = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      if (data.length === 0) {
        tableContainer.innerHTML = renderEmptyStateUI('Belum Ada Supplier', 'Tidak ada supplier yang sesuai pencarian.');
        return;
      }

      const rows = data.map(s => `
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">${s.code || `#${s.id}`}</td>
          <td class="px-5 py-3.5 font-medium text-slate-900">${s.name ?? '-'}</td>
          <td class="px-5 py-3.5 text-slate-600 text-xs">${s.phone ?? s.email ?? '-'}</td>
        </tr>`).join('');

      const paginationHtml = renderPagination(resp);

      tableContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Kode / ID</th>
                  <th class="px-5 py-3">Nama Supplier</th>
                  <th class="px-5 py-3">Kontak</th>
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
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat data supplier.';
      tableContainer.innerHTML = `<div class="p-6 text-center text-xs text-rose-600">${msg}</div>`;
    }
  };

  const debouncedSearch = createDebounce((val) => {
    state.search = val;
    state.page = 1;
    loadData();
  }, 300);

  container.querySelector('#searchInput').addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

  container.querySelector('#sortSelect').addEventListener('change', (e) => {
    const [sort, dir] = e.target.value.split('-');
    state.sort = sort;
    state.direction = dir;
    state.page = 1;
    loadData();
  });

  container.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.search = '';
    state.sort = 'name';
    state.direction = 'asc';
    state.page = 1;

    container.querySelector('#searchInput').value = '';
    container.querySelector('#sortSelect').value = 'name-asc';

    loadData();
  });

  loadData();
}
