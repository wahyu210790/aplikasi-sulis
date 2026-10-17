import { apiClient } from './api.js';
import { renderLoadingState, renderEmptyStateUI, renderPagination, createDebounce } from './utils.js';
import { openModal, closeModal } from './modal.js';

export async function renderSuppliers(container) {
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  const canMutate = ['owner', 'finance'].includes(user.role);

  let state = {
    search: '',
    sort: 'name',
    direction: 'asc',
    page: 1,
  };

  const addButtonHtml = canMutate ? `
    <button id="addSupplierBtn" class="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm shrink-0">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
      Tambah Supplier
    </button>
  ` : '';

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
        <div class="flex items-center gap-2">
          <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Reset Filter
          </button>
          ${addButtonHtml}
        </div>
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
          <td class="px-5 py-3.5 font-medium text-slate-900">
            <div>${s.name ?? '-'}</div>
            ${s.address ? `<div class="text-[11px] text-slate-400 font-normal truncate max-w-xs">${s.address}</div>` : ''}
          </td>
          <td class="px-5 py-3.5 text-slate-600 text-xs">
            <div>${s.phone ?? '-'}</div>
            ${s.email ? `<div class="text-slate-400 text-[11px]">${s.email}</div>` : ''}
          </td>
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
                  <th class="px-5 py-3">Kontak & Email</th>
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

  // Add Supplier Modal Handler
  if (canMutate) {
    const addBtn = container.querySelector('#addSupplierBtn');
    addBtn?.addEventListener('click', () => {
      const formHtml = `
        <form id="supplierCreateForm" class="space-y-4">
          <div id="supplierFormError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs"></div>
          
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nama Supplier <span class="text-rose-500">*</span></label>
            <input type="text" name="name" placeholder="Contoh: PT Sumber Material Makmur" required class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Kode Supplier (Opsional)</label>
            <input type="text" name="code" placeholder="Kosongkan untuk generate otomatis (misal SUP-XXXXXX)" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" />
            <p class="text-[11px] text-slate-400 mt-1">Jika dikosongkan, sistem akan membuat kode unik secara otomatis.</p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Nomor Telepon / WA</label>
              <input type="text" name="phone" placeholder="0812-3456-7890" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email</label>
              <input type="email" name="email" placeholder="sales@supplier.com" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Alamat (Opsional)</label>
            <textarea name="address" rows="2" placeholder="Alamat lengkap supplier..." class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"></textarea>
          </div>

          <div class="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button type="button" id="cancelSupplierBtn" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all shadow-sm">
              Batal
            </button>
            <button type="submit" id="saveSupplierBtn" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
              <span>Simpan Supplier</span>
            </button>
          </div>
        </form>
      `;

      openModal({
        title: 'Tambah Supplier Baru',
        body: formHtml
      });

      document.getElementById('cancelSupplierBtn')?.addEventListener('click', closeModal);

      const form = document.getElementById('supplierCreateForm');
      const errBox = document.getElementById('supplierFormError');
      const submitBtn = document.getElementById('saveSupplierBtn');

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
          name: formData.get('name')?.trim(),
          code: formData.get('code')?.trim() || null,
          phone: formData.get('phone')?.trim() || null,
          email: formData.get('email')?.trim() || null,
          address: formData.get('address')?.trim() || null,
        };

        try {
          await apiClient.post('/suppliers', payload);
          closeModal();
          loadData();
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<span>Simpan Supplier</span>';
          let msg = 'Gagal menyimpan supplier.';
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
