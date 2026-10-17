import { apiClient } from './api.js';
import { formatRupiah, renderLoadingState, renderEmptyStateUI, renderPagination, createDebounce } from './utils.js';
import { openModal, closeModal } from './modal.js';

export async function renderProducts(container) {
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const canMutate = ['owner', 'warehouse'].includes(user.role);

  let state = {
    search: '',
    category_id: '',
    sort: 'name',
    direction: 'asc',
    page: 1,
  };

  let categories = [];
  let units = [];
  try {
    const [catResp, unitResp] = await Promise.all([
      apiClient.get('/categories?per_page=100'),
      apiClient.get('/units')
    ]);
    categories = Array.isArray(catResp.data) ? catResp.data : (Array.isArray(catResp) ? catResp : []);
    units = Array.isArray(unitResp.data) ? unitResp.data : (Array.isArray(unitResp) ? unitResp : []);
  } catch (e) {
    // Ignore category/unit load error
  }

  const categoryOptions = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

  const addButtonHtml = canMutate ? `
    <button id="addProductBtn" class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      Tambah Produk
    </button>
  ` : '';

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Filter Bar & Actions -->
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
        <div class="flex items-center gap-2">
          <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Reset Filter
          </button>
          ${addButtonHtml}
        </div>
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
        const avgCost = p.stock?.average_cost ?? 0;
        return `
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">${p.code || `#${p.id}`}</td>
            <td class="px-5 py-3.5 font-medium text-slate-900">
              <div>${p.name ?? p.title ?? '-'}</div>
              ${p.description ? `<div class="text-[11px] text-slate-400 font-normal truncate max-w-xs">${p.description}</div>` : ''}
            </td>
            <td class="px-5 py-3.5 text-slate-600"><span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">${p.category?.name ?? 'Umum'}</span></td>
            <td class="px-5 py-3.5 text-slate-600"><span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">${p.unit?.name ?? p.unit?.code ?? '-'}</span></td>
            <td class="px-5 py-3.5 text-right font-medium text-slate-700">${formatRupiah(avgCost)}</td>
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
                  <th class="px-5 py-3">Satuan</th>
                  <th class="px-5 py-3 text-right">Harga Rata-rata (HPP)</th>
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

  // Add Product Modal Handler
  if (canMutate) {
    const addBtn = container.querySelector('#addProductBtn');
    addBtn?.addEventListener('click', async () => {
      // Re-fetch categories and units to ensure freshest data
      try {
        const [catResp, unitResp] = await Promise.all([
          apiClient.get('/categories?per_page=100'),
          apiClient.get('/units')
        ]);
        categories = Array.isArray(catResp.data) ? catResp.data : (Array.isArray(catResp) ? catResp : []);
        units = Array.isArray(unitResp.data) ? unitResp.data : (Array.isArray(unitResp) ? unitResp : []);
      } catch (e) {
        // ignore
      }

      const modalCatOptions = categories.length > 0
        ? categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')
        : '<option value="" disabled>Belum ada kategori (tambahkan di tab Kategori)</option>';

      const modalUnitOptions = units.length > 0
        ? units.map(u => `<option value="${u.id}">${u.name} (${u.code})</option>`).join('')
        : '<option value="" disabled>Belum ada satuan</option>';

      const formHtml = `
        <form id="productCreateForm" class="space-y-4">
          <div id="productFormError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs"></div>
          
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Kode Produk <span class="text-rose-500">*</span></label>
            <input type="text" name="code" placeholder="Contoh: PRD-001" required class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nama Produk <span class="text-rose-500">*</span></label>
            <input type="text" name="name" placeholder="Contoh: Semen Portland 50kg" required class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Kategori <span class="text-rose-500">*</span></label>
              <select name="category_id" required class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="" disabled selected>Pilih Kategori</option>
                ${modalCatOptions}
              </select>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Satuan <span class="text-rose-500">*</span></label>
              <select name="unit_id" required class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="" disabled selected>Pilih Satuan</option>
                ${modalUnitOptions}
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Minimum Stok</label>
            <input type="number" name="minimum_stock" min="0" placeholder="0" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Deskripsi (Opsional)</label>
            <textarea name="description" rows="2" placeholder="Keterangan spesifikasi atau catatan produk..." class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"></textarea>
          </div>

          <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancelProductBtn" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all shadow-sm">
              Batal
            </button>
            <button type="submit" id="saveProductBtn" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
              <span>Simpan Produk</span>
            </button>
          </div>
        </form>
      `;

      openModal({
        title: 'Tambah Produk Baru',
        body: formHtml
      });

      document.getElementById('cancelProductBtn')?.addEventListener('click', closeModal);

      const form = document.getElementById('productCreateForm');
      const errBox = document.getElementById('productFormError');
      const submitBtn = document.getElementById('saveProductBtn');

      form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        errBox.classList.add('hidden');
        errBox.textContent = '';
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg> Menyimpan...`;

        const formData = new FormData(form);
        const payload = {
          code: formData.get('code')?.trim(),
          name: formData.get('name')?.trim(),
          category_id: formData.get('category_id'),
          unit_id: formData.get('unit_id'),
          description: formData.get('description')?.trim() || null,
          minimum_stock: formData.get('minimum_stock') ? parseInt(formData.get('minimum_stock')) : 0,
        };

        try {
          await apiClient.post('/products', payload);
          closeModal();
          loadData();
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Simpan Produk</span>';
          let msg = 'Gagal menyimpan produk.';
          if (err.payload?.errors) {
            msg = Object.values(err.payload.errors).flat().join('<br>');
          } else if (err.payload?.message) {
            msg = err.payload.message;
          }
          errBox.innerHTML = msg;
          errBox.classList.remove('hidden');
        }
      });
    });
  }

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
