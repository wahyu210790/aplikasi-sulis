// src/purchasing.js

import { apiClient } from './api.js';
import { 
  formatRupiah, 
  formatQuantity,
  renderPageHeader, 
  renderBadge, 
  renderLoadingState, 
  renderEmptyStateUI, 
  renderErrorState,
  renderPagination,
  createDebounce
} from './utils.js';

export async function renderPurchasing(container) {
  if (!container) return;

  const headerHtml = renderPageHeader(
    'Purchasing & Purchases',
    'Kelola transaksi pembelian, pesanan barang dari supplier, dan histori penerimaan stok.'
  );

  const tabsHtml = `
    <div class="mb-6 inline-flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner">
      <button data-tab="list" class="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80">
        Daftar Purchase
      </button>
      <button data-tab="new" class="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60">
        + Buat Purchase Baru
      </button>
    </div>`;

  container.innerHTML = headerHtml + tabsHtml + `<div id="purchasingContent"></div>`;
  const contentEl = container.querySelector('#purchasingContent');

  container.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelectorAll('button[data-tab]').forEach(b => {
        b.className = 'px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60';
      });
      btn.className = 'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80';
      
      const tab = btn.getAttribute('data-tab');
      if (tab === 'list') await renderPurchaseList(contentEl);
      else if (tab === 'new') await renderPurchaseForm(contentEl);
    });
  });

  await renderPurchaseList(contentEl);
}

/** List purchases */
async function renderPurchaseList(target) {
  let state = {
    search: '',
    supplier_id: '',
    status: '',
    date_from: '',
    date_to: '',
    sort: 'created_at',
    direction: 'desc',
    page: 1,
  };

  let suppliers = [];
  try {
    const supResp = await apiClient.get('/suppliers?per_page=100');
    suppliers = Array.isArray(supResp.data) ? supResp.data : (Array.isArray(supResp) ? supResp : []);
  } catch (e) {}

  const supplierOptions = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  target.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari PO / Supplier..." value="${state.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>

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

          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="created_at-desc">Urut: Terbaru</option>
            <option value="purchase_date-desc">Urut: Tanggal (Terbaru)</option>
            <option value="purchase_date-asc">Urut: Tanggal (Terlama)</option>
            <option value="total_amount-desc">Urut: Nominal (Highest)</option>
          </select>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">Tanggal PO:</label>
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

      <div id="purchasesTableContainer"></div>
    </div>`;

  const tableContainer = target.querySelector('#purchasesTableContainer');
  const dateErr = target.querySelector('#dateValidationError');

  const loadData = async () => {
    if (state.date_from && state.date_to && state.date_from > state.date_to) {
      dateErr.classList.remove('hidden');
      return;
    }
    dateErr.classList.add('hidden');

    tableContainer.innerHTML = renderLoadingState('Memuat data purchase...');
    try {
      const queryParams = new URLSearchParams();
      if (state.search) queryParams.append('search', state.search);
      if (state.supplier_id) queryParams.append('supplier_id', state.supplier_id);
      if (state.status) queryParams.append('status', state.status);
      if (state.date_from) queryParams.append('date_from', state.date_from);
      if (state.date_to) queryParams.append('date_to', state.date_to);
      if (state.sort) queryParams.append('sort', state.sort);
      if (state.direction) queryParams.append('direction', state.direction);
      queryParams.append('page', state.page);
      queryParams.append('per_page', 15);

      const resp = await apiClient.get(`/purchases?${queryParams.toString()}`);
      const purchases = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      if (!purchases || purchases.length === 0) {
        tableContainer.innerHTML = renderEmptyStateUI(
          'Belum Ada Purchase',
          'Tidak ada transaksi pembelian yang sesuai kriteria pencarian.'
        );
        return;
      }

      const rows = purchases.map(p => {
        let badgeType = 'neutral';
        if (p.status === 'CONFIRMED') badgeType = 'success';
        else if (p.status === 'DRAFT') badgeType = 'warning';
        else if (p.status === 'CANCELLED') badgeType = 'danger';

        const actions = [];
        actions.push(`<button data-action="detail" data-id="${p.id}" class="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline">Detail</button>`);
        if (p.status === 'DRAFT') {
          actions.push(`<button data-action="confirm" data-id="${p.id}" class="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-800 hover:underline ml-3">Konfirmasi</button>`);
          actions.push(`<button data-action="cancel" data-id="${p.id}" class="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-800 hover:underline ml-3">Batal</button>`);
        }

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">${p.purchase_number}</td>
            <td class="px-5 py-3.5 text-sm font-medium text-slate-800">${p.supplier?.name || '-'}</td>
            <td class="px-5 py-3.5 text-sm text-slate-500">${p.purchase_date}</td>
            <td class="px-5 py-3.5 text-sm">${renderBadge(p.status, badgeType)}</td>
            <td class="px-5 py-3.5 text-sm font-mono font-medium text-slate-900 text-right">${formatRupiah(p.total_amount)}</td>
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
                  <th class="px-5 py-3.5">Nomor PO</th>
                  <th class="px-5 py-3.5">Supplier</th>
                  <th class="px-5 py-3.5">Tanggal</th>
                  <th class="px-5 py-3.5">Status</th>
                  <th class="px-5 py-3.5 text-right">Total Purchase</th>
                  <th class="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${rows}</tbody>
            </table>
          </div>
          ${paginationHtml}
        </div>`;

      tableContainer.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const action = btn.getAttribute('data-action');
          const id = btn.getAttribute('data-id');
          if (action === 'detail') await renderPurchaseDetail(target, id);
          else if (action === 'confirm') await confirmPurchase(target, id);
          else if (action === 'cancel') await cancelPurchase(target, id);
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
      tableContainer.innerHTML = renderErrorState(`Gagal memuat daftar purchase (status ${err.status || 500})`, () => loadData());
    }
  };

  const debouncedSearch = createDebounce((val) => {
    state.search = val;
    state.page = 1;
    loadData();
  }, 300);

  target.querySelector('#searchInput').addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));

  target.querySelector('#supplierSelect').addEventListener('change', (e) => {
    state.supplier_id = e.target.value;
    state.page = 1;
    loadData();
  });

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
    state.supplier_id = '';
    state.status = '';
    state.date_from = '';
    state.date_to = '';
    state.sort = 'created_at';
    state.direction = 'desc';
    state.page = 1;

    target.querySelector('#searchInput').value = '';
    target.querySelector('#supplierSelect').value = '';
    target.querySelector('#statusSelect').value = '';
    target.querySelector('#sortSelect').value = 'created_at-desc';
    target.querySelector('#dateFromInput').value = '';
    target.querySelector('#dateToInput').value = '';

    loadData();
  });

  await loadData();
}

/** Render purchase detail (read‑only) */
async function renderPurchaseDetail(target, purchaseId) {
  target.innerHTML = renderLoadingState('Memuat detail purchase...');
  try {
    const purchase = await apiClient.get(`/purchases/${purchaseId}`);

    let badgeType = 'neutral';
    if (purchase.status === 'CONFIRMED') badgeType = 'success';
    else if (purchase.status === 'DRAFT') badgeType = 'warning';
    else if (purchase.status === 'CANCELLED') badgeType = 'danger';

    const itemsRows = (purchase.items || []).map(it => `
      <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
        <td class="px-5 py-3 text-sm font-medium text-slate-800">
          ${it.product?.name || '-'}
          <span class="text-xs font-mono text-slate-400 block">${it.product?.code || ''}</span>
        </td>
        <td class="px-5 py-3 text-sm font-mono text-right text-slate-700">${formatQuantity(it.quantity)}</td>
        <td class="px-5 py-3 text-sm font-mono text-right text-slate-700">${formatRupiah(it.unit_cost)}</td>
        <td class="px-5 py-3 text-sm font-mono text-right font-medium text-slate-900">${formatRupiah(it.subtotal)}</td>
      </tr>`).join('');

    target.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <button id="backToList" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Kembali ke Daftar
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
            <div>
              <div class="flex items-center gap-3">
                <h3 class="text-xl font-bold text-slate-900 font-poppins">Purchase #${purchase.purchase_number}</h3>
                ${renderBadge(purchase.status, badgeType)}
              </div>
              <p class="text-sm text-slate-500 mt-1">Tanggal Transaksi: <span class="font-medium text-slate-700">${purchase.purchase_date}</span></p>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 uppercase tracking-wider block font-medium">Total Nominal</span>
              <span class="text-2xl font-bold text-blue-600 font-mono">${formatRupiah(purchase.total_amount)}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 rounded-xl p-4 border border-slate-100">
            <div>
              <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">Informasi Supplier</span>
              <p class="text-base font-semibold text-slate-800">${purchase.supplier?.name || '-'}</p>
            </div>
            <div>
              <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">Catatan Transaksi</span>
              <p class="text-sm text-slate-600">${purchase.notes || '<em>Tidak ada catatan</em>'}</p>
            </div>
          </div>

          <div>
            <h4 class="text-base font-semibold text-slate-900 font-poppins mb-3">Rincian Item Pembelian</h4>
            <div class="rounded-xl border border-slate-200/80 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th class="px-5 py-3">Produk</th>
                    <th class="px-5 py-3 text-right">Kuantitas</th>
                    <th class="px-5 py-3 text-right">Harga Satuan</th>
                    <th class="px-5 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">${itemsRows}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`;

    document.getElementById('backToList').addEventListener('click', () => renderPurchaseList(target));
  } catch (err) {
    target.innerHTML = renderErrorState(`Gagal memuat detail purchase (status ${err.status || 500})`, () => renderPurchaseDetail(target, purchaseId));
  }
}

/** Confirm a draft purchase */
async function confirmPurchase(target, purchaseId) {
  target.innerHTML = renderLoadingState('Mengonfirmasi purchase & memperbarui stok...');
  try {
    await apiClient.post(`/purchases/${purchaseId}/confirm`);
    await renderPurchaseList(target);
  } catch (err) {
    target.innerHTML = renderErrorState(`Gagal melakukan konfirmasi purchase (status ${err.status || 500})`, () => renderPurchaseList(target));
  }
}

/** Cancel a draft purchase */
async function cancelPurchase(target, purchaseId) {
  target.innerHTML = renderLoadingState('Membatalkan purchase...');
  try {
    await apiClient.post(`/purchases/${purchaseId}/cancel`);
    await renderPurchaseList(target);
  } catch (err) {
    target.innerHTML = renderErrorState(`Gagal membatalkan purchase (status ${err.status || 500})`, () => renderPurchaseList(target));
  }
}

/** Render form to create a new purchase (draft) */
async function renderPurchaseForm(target) {
  target.innerHTML = renderLoadingState('Memuat data supplier & produk...');
  try {
    const [suppliersResp, productsResp] = await Promise.all([
      apiClient.get('/suppliers?per_page=100'),
      apiClient.get('/products?per_page=100')
    ]);

    const suppliers = Array.isArray(suppliersResp?.data) ? suppliersResp.data : (Array.isArray(suppliersResp) ? suppliersResp : []);
    const products = Array.isArray(productsResp?.data) ? productsResp.data : (Array.isArray(productsResp) ? productsResp : []);

    const supplierOptions = suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
    const productOptions = products.map(p => `<option value="${p.id}">${p.name} (${p.code})</option>`).join('');

    target.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        <div class="flex items-center justify-between">
          <button id="backToList" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Kembali ke Daftar
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
          <h3 class="text-xl font-bold text-slate-900 font-poppins mb-6">Buat Transaksi Purchase Baru</h3>
          
          <form id="purchaseForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Supplier</label>
                <select name="supplier_id" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required>
                  <option value="">-- Pilih Supplier --</option>
                  ${supplierOptions}
                </select>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Tanggal Purchase</label>
                <input type="date" name="purchase_date" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Catatan Transaksi (Opsional)</label>
              <textarea name="notes" rows="2" placeholder="Tuliskan nomor referensi supplier atau catatan tambahan..." class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"></textarea>
            </div>

            <div class="border-t border-slate-100 pt-5">
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-sm font-semibold text-slate-900 uppercase tracking-wider">Item Pembelian</h4>
                <button type="button" id="addItemBtn" class="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all">
                  + Tambah Baris Item
                </button>
              </div>

              <div id="itemsContainer" class="space-y-3">
                <div class="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 item-row">
                  <div class="w-full sm:w-1/2">
                    <select class="item-product w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required>
                      <option value="">-- Pilih Produk --</option>
                      ${productOptions}
                    </select>
                  </div>
                  <div class="w-full sm:w-1/4">
                    <input type="number" step="0.001" min="0.001" placeholder="Kuantitas (Qty)" class="item-qty w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" required />
                  </div>
                  <div class="w-full sm:w-1/4">
                    <input type="number" step="0.01" min="0" placeholder="Harga Satuan (IDR)" class="item-unit w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" required />
                  </div>
                  <button type="button" class="remove-item p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Hapus Baris">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button type="button" id="cancelFormBtn" class="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-xl transition-all shadow-sm">
                Batal
              </button>
              <button type="submit" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                Simpan (Status Draft)
              </button>
            </div>
          </form>
        </div>
      </div>`;

    const backToList = () => renderPurchaseList(target);
    document.getElementById('backToList').addEventListener('click', backToList);
    document.getElementById('cancelFormBtn').addEventListener('click', backToList);

    const itemsContainer = document.getElementById('itemsContainer');
    
    // Wire up initial row remove button
    itemsContainer.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const rows = itemsContainer.querySelectorAll('.item-row');
        if (rows.length > 1) {
          e.currentTarget.closest('.item-row').remove();
        } else {
          alert('Minimal satu item harus diisi.');
        }
      });
    });

    document.getElementById('addItemBtn').addEventListener('click', () => {
      const row = document.createElement('div');
      row.className = 'flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 item-row';
      row.innerHTML = `
        <div class="w-full sm:w-1/2">
          <select class="item-product w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required>
            <option value="">-- Pilih Produk --</option>
            ${productOptions}
          </select>
        </div>
        <div class="w-full sm:w-1/4">
          <input type="number" step="0.001" min="0.001" placeholder="Kuantitas (Qty)" class="item-qty w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" required />
        </div>
        <div class="w-full sm:w-1/4">
          <input type="number" step="0.01" min="0" placeholder="Harga Satuan (IDR)" class="item-unit w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" required />
        </div>
        <button type="button" class="remove-item p-2 text-slate-400 hover:text-rose-600 transition-colors" title="Hapus Baris">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>`;
      itemsContainer.appendChild(row);
      row.querySelector('.remove-item').addEventListener('click', () => {
        const rows = itemsContainer.querySelectorAll('.item-row');
        if (rows.length > 1) {
          row.remove();
        } else {
          alert('Minimal satu item harus diisi.');
        }
      });
    });

    const form = document.getElementById('purchaseForm');
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(form);
      const supplier_id = formData.get('supplier_id');
      const purchase_date = formData.get('purchase_date');
      const notes = formData.get('notes');

      const items = [];
      itemsContainer.querySelectorAll('.item-row').forEach(row => {
        const product_id = row.querySelector('.item-product').value;
        const quantity = parseFloat(row.querySelector('.item-qty').value);
        const unit_cost = parseFloat(row.querySelector('.item-unit').value);
        if (product_id && !isNaN(quantity) && !isNaN(unit_cost)) {
          items.push({ product_id, quantity, unit_cost });
        }
      });

      if (items.length === 0) {
        alert('Harap tambahkan setidaknya satu item yang valid.');
        return;
      }

      try {
        await apiClient.post('/purchases', { supplier_id, purchase_date, notes, items });
        await renderPurchaseList(target);
      } catch (err) {
        target.innerHTML = renderErrorState(`Gagal menyimpan purchase (status ${err.status || 500})`, () => renderPurchaseForm(target));
      }
    });
  } catch (err) {
    target.innerHTML = renderErrorState(`Gagal memuat form purchase (status ${err.status || 500})`, () => renderPurchaseForm(target));
  }
}

