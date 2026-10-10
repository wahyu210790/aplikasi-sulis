import { apiClient } from './api.js';
import { formatRupiah, renderLoadingState, renderEmptyStateUI, renderPagination, createDebounce } from './utils.js';

export async function renderProducts(container) {
  let state = {
    search: '',
    category_id: '',
    sort: 'name',
    direction: 'asc',
    page: 1,
  };

  let categories = [];
  try {
    const catResp = await apiClient.get('/categories?per_page=100');
    categories = Array.isArray(catResp.data) ? catResp.data : (Array.isArray(catResp) ? catResp : []);
  } catch (e) {
    // Ignore category load error
  }

  const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Filter Bar -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nama atau kode produk..." value="${state.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="categorySelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Kategori</option>
            ${categoryOptions}
          </select>
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

      <div id="productsTableContainer"></div>
    </div>`;

  const tableContainer = container.querySelector('#productsTableContainer');

  const loadData = async () => {
    tableContainer.innerHTML = renderLoadingState('Memuat katalog produk...');
    try {
      const queryParams = new URLSearchParams();
      if (state.search) queryParams.append('search', state.search);
      if (state.category_id) queryParams.append('category_id', state.category_id);
      if (state.sort) queryParams.append('sort', state.sort);
      if (state.direction) queryParams.append('direction', state.direction);
      queryParams.append('page', state.page);
      queryParams.append('per_page', 15);

      const resp = await apiClient.get(`/products?${queryParams.toString()}`);
      const data = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      if (data.length === 0) {
        tableContainer.innerHTML = renderEmptyStateUI('Katalog Produk Kosong', 'Tidak ada produk yang sesuai dengan kriteria pencarian.');
        return;
      }

      const rows = data.map(p => {
        const qty = p.stock?.quantity ?? p.quantity ?? 0;
        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">${p.code || `#${p.id}`}</td>
            <td class="px-5 py-3.5 font-medium text-slate-900">${p.name ?? p.title ?? '-'}</td>
            <td class="px-5 py-3.5 text-slate-600"><span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">${p.category?.name ?? 'Umum'}</span></td>
            <td class="px-5 py-3.5 text-right font-semibold text-slate-900">${formatRupiah(p.price ?? 0)}</td>
            <td class="px-5 py-3.5 text-right font-semibold text-slate-900">${qty}</td>
          </tr>`;
      }).join('');

      const paginationHtml = renderPagination(resp);

      tableContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Kode / ID</th>
                  <th class="px-5 py-3">Nama Produk</th>
                  <th class="px-5 py-3">Kategori</th>
                  <th class="px-5 py-3 text-right">Harga Satuan</th>
                  <th class="px-5 py-3 text-right">Stok Fisik</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">${rows}</tbody>
            </table>
          </div>
          ${paginationHtml}
        </div>`;

      // Attach pagination event listeners
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
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat data produk.';
      tableContainer.innerHTML = `<div class="p-6 text-center text-xs text-rose-600">${msg}</div>`;
    }
  };

  // Event listeners
  const debouncedSearch = createDebounce((val) => {
    state.search = val;
    state.page = 1;
    loadData();
  }, 300);

  container.querySelector('#searchInput').addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

  container.querySelector('#categorySelect').addEventListener('change', (e) => {
    state.category_id = e.target.value;
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

  container.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.search = '';
    state.category_id = '';
    state.sort = 'name';
    state.direction = 'asc';
    state.page = 1;

    container.querySelector('#searchInput').value = '';
    container.querySelector('#categorySelect').value = '';
    container.querySelector('#sortSelect').value = 'name-asc';

    loadData();
  });

  loadData();
}
