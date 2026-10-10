import { apiClient } from './api.js';
import { formatRupiah, renderLoadingState, renderEmptyStateUI, renderPagination, createDebounce } from './utils.js';

export async function renderInventoryOverview(container) {
  if (!container) return;

  let state = {
    search: '',
    category_id: '',
    low_stock: '',
    sort: 'product_name',
    direction: 'asc',
    page: 1,
  };

  let categories = [];
  try {
    const catResp = await apiClient.get('/categories?per_page=100');
    categories = Array.isArray(catResp.data) ? catResp.data : (Array.isArray(catResp) ? catResp : []);
  } catch (e) {}

  const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari produk atau kode..." value="${state.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="categorySelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Kategori</option>
            ${categoryOptions}
          </select>
          <select id="lowStockSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Stok</option>
            <option value="1">Stok Menipis (&le; 5)</option>
            <option value="0">Stok Normal (&gt; 5)</option>
          </select>
          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="product_name-asc">Urut: Nama Produk</option>
            <option value="quantity-desc">Urut: Kuantitas (Terbanyak)</option>
            <option value="quantity-asc">Urut: Kuantitas (Tersedikit)</option>
            <option value="total_value-desc">Urut: Total Valuation</option>
          </select>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="overviewTableContainer"></div>
    </div>`;

  const tableContainer = container.querySelector('#overviewTableContainer');

  const loadData = async () => {
    tableContainer.innerHTML = renderLoadingState('Memuat stok persediaan...');
    try {
      const queryParams = new URLSearchParams();
      if (state.search) queryParams.append('search', state.search);
      if (state.category_id) queryParams.append('category_id', state.category_id);
      if (state.low_stock !== '') queryParams.append('low_stock', state.low_stock);
      if (state.sort) queryParams.append('sort', state.sort);
      if (state.direction) queryParams.append('direction', state.direction);
      queryParams.append('page', state.page);
      queryParams.append('per_page', 15);

      const resp = await apiClient.get(`/inventory/stocks?${queryParams.toString()}`);
      const data = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      if (data.length === 0) {
        tableContainer.innerHTML = renderEmptyStateUI('Stok Fisik Kosong', 'Tidak ada data stok yang sesuai pencarian.');
        return;
      }

      const rows = data.map(s => {
        const code = s.product?.code ?? `#${s.product_id}`;
        const name = s.product?.name ?? '-';
        const qty = Number(s.quantity ?? 0);
        const avgCost = formatRupiah(s.average_cost ?? 0);
        const totalVal = formatRupiah(s.total_value ?? 0);
        const isLow = qty <= 5;

        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">${code}</td>
            <td class="px-5 py-3.5 font-medium text-slate-900">${name}</td>
            <td class="px-5 py-3.5 text-right font-semibold ${isLow ? 'text-rose-600 font-bold' : 'text-slate-900'}">${qty} ${isLow ? '<span class="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded-md ml-1">Menipis</span>' : ''}</td>
            <td class="px-5 py-3.5 text-right font-medium text-slate-700">${avgCost}</td>
            <td class="px-5 py-3.5 text-right font-bold text-slate-900">${totalVal}</td>
          </tr>`;
      }).join('');

      const paginationHtml = renderPagination(resp);

      tableContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Kode</th>
                  <th class="px-5 py-3">Nama Produk</th>
                  <th class="px-5 py-3 text-right">Kuantitas</th>
                  <th class="px-5 py-3 text-right">Average Cost</th>
                  <th class="px-5 py-3 text-right">Total Valuation</th>
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
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat data stok.';
      tableContainer.innerHTML = `<div class="p-6 text-center text-xs text-rose-600">${msg}</div>`;
    }
  };

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

  container.querySelector('#lowStockSelect').addEventListener('change', (e) => {
    state.low_stock = e.target.value;
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
    state.low_stock = '';
    state.sort = 'product_name';
    state.direction = 'asc';
    state.page = 1;

    container.querySelector('#searchInput').value = '';
    container.querySelector('#categorySelect').value = '';
    container.querySelector('#lowStockSelect').value = '';
    container.querySelector('#sortSelect').value = 'product_name-asc';

    loadData();
  });

  loadData();
}
