// src/stockOpname.js
/*
  Stock Opname UI module.
  Provides List, Create, Detail (with items), Complete, Cancel.
  Role access: owner & warehouse allowed; finance denied.
*/
import { apiClient } from './api.js';
import { 
  formatRupiah, 
  renderPageHeader, 
  renderBadge, 
  renderLoadingState, 
  renderEmptyStateUI, 
  renderErrorState, 
  renderAccessDeniedUI,
  renderPagination,
  createDebounce
} from './utils.js';

// ----- Main entry -----
export async function renderStockOpname(container, fullRoute = '/stock-opname') {
  if (!container) return;
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (user.role === 'finance') {
    container.innerHTML = renderAccessDeniedUI(
      'Stock Opname',
      'Modul ini khusus untuk peran Owner dan Warehouse. Peran Finance tidak memiliki akses.'
    );
    return;
  }

  const headerHtml = renderPageHeader(
    'Stock Opname / Pencocokan Stok Fisik',
    'Lakukan audit fisik persediaan barang, catat selisih antara stok sistem dan hasil hitung fisik, serta otomatiskan penyesuaian inventaris.'
  );

  // Parse sub‑route
  const parts = fullRoute.split('/').filter(Boolean);
  const sub = parts[1];

  if (!sub) {
    const tabsHtml = `
      <div class="mb-6 inline-flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner">
        <button data-tab="list" class="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80">
          Daftar Opname
        </button>
        <button data-tab="create" class="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60">
          + Buat Opname Baru
        </button>
      </div>`;

    container.innerHTML = headerHtml + tabsHtml + `<div id="stockOpnameContent"></div>`;
    const contentEl = container.querySelector('#stockOpnameContent');

    container.querySelectorAll('button[data-tab]').forEach(btn => {
      btn.addEventListener('click', async () => {
        container.querySelectorAll('button[data-tab]').forEach(b => {
          b.className = 'px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60';
        });
        btn.className = 'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80';

        const tab = btn.getAttribute('data-tab');
        if (tab === 'list') await renderList(contentEl);
        else if (tab === 'create') await renderCreate(contentEl);
      });
    });

    await renderList(contentEl);
    return;
  }

  if (sub === 'create') {
    const contentEl = document.createElement('div');
    container.innerHTML = headerHtml;
    container.appendChild(contentEl);
    await renderCreate(contentEl);
    return;
  }

  // Assume sub is an ID
  const opnameId = sub;
  const contentEl = document.createElement('div');
  container.innerHTML = headerHtml;
  container.appendChild(contentEl);
  await renderDetail(contentEl, opnameId);
}

// ----- List view -----
async function renderList(target) {
  let state = {
    search: '',
    status: '',
    date_from: '',
    date_to: '',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
  };

  target.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nomor opname / catatan..." value="${state.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>

          <select id="statusSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="created_at-desc">Urut: Terbaru</option>
            <option value="opname_date-desc">Urut: Tanggal Opname (Terbaru)</option>
            <option value="opname_date-asc">Urut: Tanggal Opname (Terlama)</option>
          </select>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">Tanggal Opname:</label>
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

      <div id="stockOpnameTableContainer"></div>
    </div>`;

  const tableContainer = target.querySelector('#stockOpnameTableContainer');
  const dateErr = target.querySelector('#dateValidationError');

  const loadData = async () => {
    if (state.date_from && state.date_to && state.date_from > state.date_to) {
      dateErr.classList.remove('hidden');
      return;
    }
    dateErr.classList.add('hidden');

    tableContainer.innerHTML = renderLoadingState('Memuat daftar Stock Opname...');
    try {
      const queryParams = new URLSearchParams();
      if (state.search) queryParams.append('search', state.search);
      if (state.status) queryParams.append('status', state.status);
      if (state.date_from) queryParams.append('date_from', state.date_from);
      if (state.date_to) queryParams.append('date_to', state.date_to);
      if (state.sort) queryParams.append('sort', state.sort);
      if (state.direction) queryParams.append('direction', state.direction);
      queryParams.append('page', state.page);
      queryParams.append('per_page', 15);

      const resp = await apiClient.get(`/stock-opnames?${queryParams.toString()}`);
      const list = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      if (!list || list.length === 0) {
        tableContainer.innerHTML = renderEmptyStateUI(
          'Belum Ada Stock Opname',
          'Tidak ada kegiatan pencocokan stok fisik yang sesuai pencarian.'
        );
        return;
      }

      const rows = list.map(o => {
        let badgeType = 'neutral';
        if (o.status === 'COMPLETED') badgeType = 'success';
        else if (o.status === 'DRAFT') badgeType = 'warning';
        else if (o.status === 'CANCELLED') badgeType = 'danger';

        const actions = [];
        actions.push(`<button data-action="view" data-id="${o.id}" class="font-semibold text-blue-600 hover:text-blue-800 hover:underline">Detail</button>`);
        if (o.status === 'DRAFT') {
          actions.push(`<button data-action="complete" data-id="${o.id}" class="font-semibold text-emerald-600 hover:text-emerald-800 hover:underline ml-3">Complete</button>`);
          actions.push(`<button data-action="cancel" data-id="${o.id}" class="font-semibold text-rose-600 hover:text-rose-800 hover:underline ml-3">Batal</button>`);
        }

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">#${o.id}</td>
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">${o.opname_number ?? '-'}</td>
            <td class="px-5 py-3.5 text-sm text-slate-600">${o.opname_date ?? '-'}</td>
            <td class="px-5 py-3.5 text-sm">${renderBadge(o.status, badgeType)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-700">${o.items?.length ?? 0} item</td>
            <td class="px-5 py-3.5 text-sm text-slate-600">${o.created_by ?? '-'}</td>
            <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">${actions.join('')}</td>
          </tr>`;
      }).join('');

      const paginationHtml = renderPagination(resp);

      tableContainer.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th class="px-5 py-3.5">ID</th>
                  <th class="px-5 py-3.5">Nomor Opname</th>
                  <th class="px-5 py-3.5">Tanggal</th>
                  <th class="px-5 py-3.5">Status</th>
                  <th class="px-5 py-3.5">Total Item</th>
                  <th class="px-5 py-3.5">Pembuat</th>
                  <th class="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${rows}</tbody>
            </table>
          </div>
          ${paginationHtml}
        </div>`;

      tableContainer.querySelectorAll('button[data-action]').forEach(btn => {
        const id = btn.getAttribute('data-id');
        const act = btn.getAttribute('data-action');
        btn.addEventListener('click', async () => {
          if (act === 'view') await renderDetail(target, id);
          else if (act === 'complete') await handleComplete(target, id);
          else if (act === 'cancel') await handleCancel(target, id);
        });
      });

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
      tableContainer.innerHTML = renderErrorState(`Gagal memuat daftar Stock Opname.`, () => loadData());
    }
  };

  const debouncedSearch = createDebounce((val) => {
    state.search = val;
    state.page = 1;
    loadData();
  }, 300);

  target.querySelector('#searchInput').addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

  target.querySelector('#statusSelect').addEventListener('change', (e) => {
    state.status = e.target.value;
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
    state.status = '';
    state.date_from = '';
    state.date_to = '';
    state.sort = 'created_at';
    state.direction = 'desc';
    state.page = 1;

    target.querySelector('#searchInput').value = '';
    target.querySelector('#statusSelect').value = '';
    target.querySelector('#sortSelect').value = 'created_at-desc';
    target.querySelector('#dateFromInput').value = '';
    target.querySelector('#dateToInput').value = '';

    loadData();
  });

  await loadData();
}

// ----- Create view -----
async function renderCreate(target) {
  target.innerHTML = renderLoadingState('Memuat form Stock Opname...');
  async function load() {
    try {
      target.innerHTML = `
        <div class="space-y-6 max-w-2xl">
          <div class="flex items-center justify-between">
            <button id="backBtn" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Kembali ke Daftar
            </button>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 class="text-xl font-bold text-slate-900 font-poppins mb-6">Buat Stock Opname Baru</h3>

            <form id="opnameForm" class="space-y-5">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tanggal Pelaksanaan Opname</label>
                <input type="date" name="opname_date" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value="${new Date().toISOString().split('T')[0]}" required />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Catatan Pelaksanaan (Opsional)</label>
                <textarea name="notes" rows="3" placeholder="Tuliskan keterangan seperti lokasi gudang, tim pencatat, atau alasan audit..." class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"></textarea>
              </div>

              <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" id="cancelFormBtn" class="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-xl transition-all shadow-sm">
                  Batal
                </button>
                <button type="submit" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                  Buat & Lanjutkan Tambah Item →
                </button>
              </div>
            </form>
          </div>
        </div>`;

      const backToList = () => renderList(target);
      document.getElementById('backBtn').addEventListener('click', backToList);
      document.getElementById('cancelFormBtn').addEventListener('click', backToList);

      const form = document.getElementById('opnameForm');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        try {
          const resp = await apiClient.post('/stock-opnames', data);
          const newId = resp.id ?? resp.data?.id;
          await renderDetail(target, newId);
        } catch (err) {
          const msg = err.status === 422 ? 'Validasi gagal.' : 'Gagal membuat Stock Opname.';
          target.innerHTML = renderErrorState(msg, load);
        }
      });
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat form.';
      target.innerHTML = renderErrorState(msg, load);
    }
  }
  await load();
}

// ----- Detail view -----
async function renderDetail(target, opnameId) {
  target.innerHTML = renderLoadingState('Memuat detail Stock Opname...');
  async function load() {
    try {
      const [opResp, productsResp] = await Promise.all([
        apiClient.get(`/stock-opnames/${opnameId}`),
        apiClient.get('/products'),
      ]);
      const opname = opResp.data ?? opResp;
      const products = productsResp.data ?? productsResp;

      let badgeType = 'neutral';
      if (opname.status === 'COMPLETED') badgeType = 'success';
      else if (opname.status === 'DRAFT') badgeType = 'warning';
      else if (opname.status === 'CANCELLED') badgeType = 'danger';

      // Items table
      const itemsRows = (opname.items || []).map(it => {
        const editBtn = opname.status === 'DRAFT' ? `<button data-action="edit" data-item-id="${it.id}" class="text-blue-600 hover:underline font-semibold mr-3">Edit</button>` : '';
        const delBtn = opname.status === 'DRAFT' ? `<button data-action="delete" data-item-id="${it.id}" class="text-rose-600 hover:underline font-semibold">Delete</button>` : '';

        const diff = Number(it.difference_quantity || 0);
        let diffBadge = `<span class="font-mono text-slate-500">0</span>`;
        if (diff > 0) {
          diffBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">+${diff}</span>`;
        } else if (diff < 0) {
          diffBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200/80">${diff}</span>`;
        }

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 text-sm font-medium text-slate-800">
              ${it.product?.name ?? '-'}
              <span class="text-xs font-mono text-slate-400 block">${it.product?.code ?? ''}</span>
            </td>
            <td class="px-5 py-3.5 text-sm font-mono text-right text-slate-700">${it.system_quantity}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-right font-semibold text-slate-900">${it.physical_quantity}</td>
            <td class="px-5 py-3.5 text-sm text-right font-mono">${diffBadge}</td>
            <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">${editBtn} ${delBtn}</td>
          </tr>`;
      }).join('');

      target.innerHTML = `
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <button id="backBtn" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Kembali ke Daftar Opname
            </button>
          </div>

          <!-- Header summary & stepper -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
              <div>
                <div class="flex items-center gap-3">
                  <h3 class="text-xl font-bold text-slate-900 font-poppins">Opname #${opname.opname_number || opname.id}</h3>
                  ${renderBadge(opname.status, badgeType)}
                </div>
                <p class="text-sm text-slate-500 mt-1">Tanggal Pelaksanaan: <span class="font-medium text-slate-700">${opname.opname_date ?? '-'}</span> • Pembuat: <span class="font-medium text-slate-700">${opname.created_by ?? '-'}</span></p>
              </div>

              ${opname.status === 'DRAFT' ? `
                <div class="flex items-center gap-2">
                  <button id="completeBtn" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                    ✓ Complete & Proses Selisih
                  </button>
                  <button id="cancelBtn" class="px-4 py-2 bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition-all shadow-sm">
                    Batalkan
                  </button>
                </div>` : ''}
            </div>

            <!-- Workflow Stepper -->
            <div class="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-center text-xs">
              <div class="space-y-1">
                <span class="font-semibold text-slate-700">1. Draft Created</span>
                <p class="text-slate-400">Dokumen opname dibuat</p>
              </div>
              <div class="space-y-1">
                <span class="font-semibold ${opname.items?.length > 0 ? 'text-blue-600' : 'text-slate-500'}">2. Hitung Fisik (${opname.items?.length || 0} item)</span>
                <p class="text-slate-400">Input hasil fisik barang</p>
              </div>
              <div class="space-y-1">
                <span class="font-semibold ${opname.status === 'COMPLETED' ? 'text-emerald-600' : 'text-slate-400'}">3. Complete Opname</span>
                <p class="text-slate-400">Otomatisasi adjustment stok</p>
              </div>
            </div>

            <!-- Items table -->
            <div>
              <h4 class="text-base font-semibold text-slate-900 font-poppins mb-3">Item Hasil Audit Fisik</h4>
              ${itemsRows ? `
                <div class="rounded-xl border border-slate-200/80 overflow-hidden">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th class="px-5 py-3">Produk</th>
                        <th class="px-5 py-3 text-right">System Qty</th>
                        <th class="px-5 py-3 text-right">Physical Qty</th>
                        <th class="px-5 py-3 text-right">Difference (Selisih)</th>
                        <th class="px-5 py-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">${itemsRows}</tbody>
                  </table>
                </div>` : `
                <div class="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p class="text-sm font-medium text-slate-600">Belum Ada Item Yang Ditambahkan</p>
                  <p class="text-xs text-slate-400 mt-1">Gunakan form di bawah untuk memasukkan hasil hitung fisik barang.</p>
                </div>`}
            </div>

            <!-- Add item form for DRAFT -->
            ${opname.status === 'DRAFT' ? `
              <div class="border-t border-slate-100 pt-6">
                <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">+ Tambah Item Ke Hasil Audit</h4>
                <form id="addItemForm" class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Pilih Produk</label>
                    <select name="product_id" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required>
                      <option value="">-- Pilih Produk --</option>
                      ${products.map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`).join('')}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Hasil Hitung Fisik (Physical Qty)</label>
                    <input type="number" step="0.001" min="0" name="physical_quantity" placeholder="0" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" required />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Catatan Selisih (Opsional)</label>
                    <input type="text" name="notes" placeholder="Contoh: Dus rusak / Selisih fisik" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                  </div>
                  <div class="sm:col-span-3 flex justify-end">
                    <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                      + Tambah Baris Audit
                    </button>
                  </div>
                </form>
              </div>` : ''}
          </div>
        </div>`;

      document.getElementById('backBtn').addEventListener('click', () => renderList(target));

      if (opname.status === 'DRAFT') {
        const addForm = document.getElementById('addItemForm');
        if (addForm) {
          addForm.addEventListener('submit', async e => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(addForm));
            try {
              await apiClient.post(`/stock-opnames/${opnameId}/items`, data);
              await renderDetail(target, opnameId);
            } catch (err) {
              const msg = err.status === 422 ? 'Validasi item gagal.' : 'Gagal menambah item.';
              target.innerHTML = renderErrorState(msg, load);
            }
          });
        }

        target.querySelectorAll('button[data-action]').forEach(btn => {
          const itemId = btn.getAttribute('data-item-id');
          const act = btn.getAttribute('data-action');
          btn.addEventListener('click', async () => {
            if (act === 'edit') await renderEditItem(target, opnameId, itemId, products);
            else if (act === 'delete') await handleDeleteItem(target, opnameId, itemId);
          });
        });

        document.getElementById('completeBtn')?.addEventListener('click', async () => {
          if (confirm('Selesaikan Stock Opname ini? Selisih quantity fisik akan otomatis dicatat sebagai transaksi adjustment persediaan stok.')) {
            try {
              await apiClient.post(`/stock-opnames/${opnameId}/complete`);
              await renderDetail(target, opnameId);
            } catch (err) {
              const msg = err.payload?.message || 'Gagal melakukan complete.';
              target.innerHTML = renderErrorState(msg, load);
            }
          }
        });

        document.getElementById('cancelBtn')?.addEventListener('click', async () => {
          if (confirm('Apakah Anda yakin ingin membatalkan Stock Opname ini?')) {
            try {
              await apiClient.post(`/stock-opnames/${opnameId}/cancel`);
              await renderDetail(target, opnameId);
            } catch (err) {
              const msg = err.payload?.message || 'Gagal membatalkan.';
              target.innerHTML = renderErrorState(msg, load);
            }
          }
        });
      }
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat detail Stock Opname.';
      target.innerHTML = renderErrorState(msg, load);
    }
  }
  await load();
}

// ----- Edit Item -----
async function renderEditItem(container, opnameId, itemId, products) {
  container.innerHTML = renderLoadingState('Memuat data edit item...');
  async function load() {
    try {
      const itemResp = await apiClient.get(`/stock-opnames/${opnameId}/items/${itemId}`);
      const item = itemResp.data ?? itemResp;

      container.innerHTML = `
        <div class="space-y-6 max-w-xl">
          <div class="flex items-center justify-between">
            <button id="backDetailBtn" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Kembali ke Detail Opname
            </button>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
            <h3 class="text-xl font-bold text-slate-900 font-poppins">Edit Item Hasil Audit</h3>

            <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
              <p class="font-medium text-slate-800">${item.product?.name ?? '-'} <span class="font-mono text-slate-400">(${item.product?.code ?? ''})</span></p>
              <p class="text-xs text-slate-500 mt-1">Stok Tercatat di Sistem: <span class="font-mono font-semibold text-slate-700">${item.system_quantity}</span></p>
            </div>

            <form id="editItemForm" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Kuantitas Fisik (Physical Qty)</label>
                <input type="number" step="0.001" min="0" name="physical_quantity" value="${item.physical_quantity}" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" required />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Catatan Selisih (Opsional)</label>
                <textarea name="notes" rows="2" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">${item.notes ?? ''}</textarea>
              </div>

              <div class="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" id="cancelEditBtn" class="px-5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all shadow-sm">
                  Batal
                </button>
                <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>`;

      const backDetail = () => renderDetail(container, opnameId);
      document.getElementById('backDetailBtn').addEventListener('click', backDetail);
      document.getElementById('cancelEditBtn').addEventListener('click', backDetail);

      const form = document.getElementById('editItemForm');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        try {
          await apiClient.put(`/stock-opnames/${opnameId}/items/${itemId}`, data);
          await renderDetail(container, opnameId);
        } catch (err) {
          const msg = err.status === 422 ? 'Validasi gagal.' : 'Gagal memperbarui item.';
          container.innerHTML = renderErrorState(msg, load);
        }
      });
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat data item.';
      container.innerHTML = renderErrorState(msg, load);
    }
  }
  await load();
}

// ----- Delete Item -----
async function handleDeleteItem(container, opnameId, itemId) {
  if (!confirm('Apakah Anda yakin ingin menghapus item ini dari daftar opname?')) return;
  try {
    await apiClient.delete(`/stock-opnames/${opnameId}/items/${itemId}`);
    await renderDetail(container, opnameId);
  } catch (err) {
    const msg = err.payload?.message || 'Gagal menghapus item.';
    container.innerHTML = renderErrorState(msg, () => renderDetail(container, opnameId));
  }
}

// ----- Complete / Cancel from list -----
async function handleComplete(container, opnameId) {
  if (!confirm('Selesaikan Stock Opname ini? Selisih quantity fisik akan otomatis dicatat sebagai transaksi adjustment persediaan stok.')) return;
  try {
    await apiClient.post(`/stock-opnames/${opnameId}/complete`);
    await renderList(container);
  } catch (err) {
    const msg = err.payload?.message || 'Gagal melakukan complete.';
    container.innerHTML = renderErrorState(msg, () => renderList(container));
  }
}

async function handleCancel(container, opnameId) {
  if (!confirm('Apakah Anda yakin ingin membatalkan Stock Opname ini?')) return;
  try {
    await apiClient.post(`/stock-opnames/${opnameId}/cancel`);
    await renderList(container);
  } catch (err) {
    const msg = err.payload?.message || 'Gagal membatalkan.';
    container.innerHTML = renderErrorState(msg, () => renderList(container));
  }
}
