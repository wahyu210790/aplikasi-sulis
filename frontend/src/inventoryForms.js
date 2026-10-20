// src/inventoryForms.js

import { apiClient } from './api.js';
import { renderInventoryOverview } from './inventoryOverview.js';
import { renderInventoryMovements } from './inventoryMovements.js';

/** Utility to fetch products from /inventory/stocks */
async function fetchProducts() {
  try {
    const resp = await apiClient.get('/inventory/stocks?per_page=100');
    const stocks = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
    return stocks.map(s => s.product).filter(p => p && p.id);
  } catch (e) {
    return [];
  }
}

/** Utility to fetch projects (for select) */
async function fetchProjects() {
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (user.role === 'warehouse') {
    return [];
  }
  try {
    const resp = await apiClient.get('/projects');
    const data = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
    return data.filter(p => p && p.id);
  } catch (e) {
    return [];
  }
}

function renderLoading(container, message = 'Memuat form...') {
  if (!container) return;
  container.innerHTML = `<div class="flex items-center justify-center p-6"><p class="text-gray-600">${message}</p></div>`;
}

function renderError(container, message, retryCallback) {
  if (!container) return;
  container.innerHTML = `
    <div class="p-4">
      <p class="text-danger mb-4">${message}</p>
      <button id="retryBtnForms" class="bg-primary text-white px-3 py-1 rounded hover:opacity-90">Coba Lagi</button>
    </div>`;
  const retryBtn = container.querySelector('#retryBtnForms');
  if (retryBtn && retryCallback) {
    retryBtn.addEventListener('click', retryCallback);
  }
}

function productSelectHtml(products, selectedId = '') {
  if (!Array.isArray(products) || products.length === 0) {
    return `<select name="product_id" class="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 w-full mb-3" disabled><option value="">(Tidak ada produk)</option></select>`;
  }
  const options = products.map(p => `<option value="${p.id}" ${p.id == selectedId ? 'selected' : ''}>${p.code ? `${p.code} - ${p.name}` : (p.name ?? p.id)}</option>`).join('');
  return `<select name="product_id" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required>${options}</select>`;
}

function projectSelectHtml(projects, selectedId = '') {
  if (!Array.isArray(projects) || projects.length === 0) {
    return `<select name="project_id" class="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 w-full mb-3"><option value="">-- Tanpa Project --</option></select>`;
  }
  const options = projects.map(p => `<option value="${p.id}" ${p.id == selectedId ? 'selected' : ''}>${p.name ?? p.id}</option>`).join('');
  return `<select name="project_id" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"><option value="">-- Pilih Project --</option>${options}</select>`;
}

function renderForm(container, title, fieldsHtml, submitHandler) {
  const formHtml = `
    <form class="space-y-1">
      ${fieldsHtml}
      <button type="submit" class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all w-full mt-3 flex items-center justify-center gap-2">
        <span>Simpan Transaksi</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      </button>
    </form>`;
  container.innerHTML = `<h4 class="font-heading text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200/80 flex items-center justify-between"><span>${title}</span></h4>${formHtml}`;
  const form = container.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {};
    new FormData(form).forEach((value, key) => { data[key] = value; });
    await submitHandler(data);
  });
}

async function refreshAll() {
  const overviewContainer = document.getElementById('inventoryOverview');
  const movementsContainer = document.getElementById('inventoryMovements');
  if (overviewContainer) renderInventoryOverview(overviewContainer);
  if (movementsContainer) renderInventoryMovements(movementsContainer);
}

async function handlePurchaseIn(data) {
  try {
    await apiClient.post('/inventory/purchase-in', data);
    alert('Purchase In berhasil disimpan');
    await refreshAll();
  } catch (err) {
    if (err.status === 422 && err.payload?.data) {
      alert('Validasi gagal: ' + JSON.stringify(err.payload.data));
    } else {
      alert('Error: ' + (err.payload?.message ?? err.message));
    }
  }
}

async function handleProjectUsage(data) {
  try {
    await apiClient.post('/inventory/project-usage', data);
    alert('Project Usage berhasil disimpan');
    await refreshAll();
  } catch (err) {
    if (err.status === 422 && err.payload?.data) {
      alert('Validasi gagal: ' + JSON.stringify(err.payload.data));
    } else {
      alert('Error: ' + (err.payload?.message ?? err.message));
    }
  }
}

async function handleStockOut(data) {
  try {
    await apiClient.post('/inventory/stock-out', data);
    alert('Stock Out berhasil disimpan');
    await refreshAll();
  } catch (err) {
    if (err.status === 422 && err.payload?.data) {
      alert('Validasi gagal: ' + JSON.stringify(err.payload.data));
    } else {
      alert('Error: ' + (err.payload?.message ?? err.message));
    }
  }
}

async function handleAdjustmentIn(data) {
  try {
    await apiClient.post('/inventory/adjustment-in', data);
    alert('Adjustment In berhasil disimpan');
    await refreshAll();
  } catch (err) {
    if (err.status === 422 && err.payload?.data) {
      alert('Validasi gagal: ' + JSON.stringify(err.payload.data));
    } else {
      alert('Error: ' + (err.payload?.message ?? err.message));
    }
  }
}

async function handleAdjustmentOut(data) {
  try {
    await apiClient.post('/inventory/adjustment-out', data);
    alert('Adjustment Out berhasil disimpan');
    await refreshAll();
  } catch (err) {
    if (err.status === 422 && err.payload?.data) {
      alert('Validasi gagal: ' + JSON.stringify(err.payload.data));
    } else {
      alert('Error: ' + (err.payload?.message ?? err.message));
    }
  }
}

export async function renderInventoryForms(container) {
  if (!container) return;
  renderLoading(container);
  const load = async () => {
    try {
      const [products, projects] = await Promise.all([fetchProducts(), fetchProjects()]);

      const formsWrapper = document.createElement('div');
      formsWrapper.className = 'p-5';

      const titleHtml = `
        <div class="mb-5">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Form Transaksi Inventory</h3>
          <p class="text-xs text-slate-500">Pencatatan mutasi fisik gudang: penggunaan material project, barang keluar, & penyesuaian stok</p>
        </div>
        <!-- Banner Informasi Penyatuan Jalur Pembelian -->
        <div class="mb-5 bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3 text-slate-700">
          <div class="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="flex-1 text-xs">
            <h4 class="font-semibold text-blue-900 mb-0.5">Pencatatan Pembelian Barang Dari Supplier</h4>
            <p class="text-slate-600 leading-relaxed">
              Seluruh pembelian barang masuk dari supplier wajib dicatat melalui menu <a href="#/purchasing" class="font-semibold text-blue-600 hover:text-blue-800 underline">Purchasing</a> (Purchase Order). Stok barang akan bertambah secara otomatis dan tercatat rapi saat dokumen PO berstatus <strong>CONFIRMED</strong>.
            </p>
          </div>
        </div>`;

      const gridDiv = document.createElement('div');
      gridDiv.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-5';

      // Project Usage
      const usageDiv = document.createElement('div');
      usageDiv.className = 'bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card';
      const usageFields = `
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${productSelectHtml(products)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Project</label>
        ${projectSelectHtml(projects)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`;
      renderForm(usageDiv, 'Project Usage', usageFields, handleProjectUsage);
      gridDiv.appendChild(usageDiv);

      // Stock Out
      const outDiv = document.createElement('div');
      outDiv.className = 'bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card';
      const outFields = `
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${productSelectHtml(products)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`;
      renderForm(outDiv, 'Stock Out', outFields, handleStockOut);
      gridDiv.appendChild(outDiv);

      // Adjustment In
      const adjInDiv = document.createElement('div');
      adjInDiv.className = 'bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card';
      const adjInFields = `
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${productSelectHtml(products)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Harga Satuan (Unit Cost)</label>
        <input type="number" step="0.01" name="unit_cost" min="0" placeholder="Unit Cost" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`;
      renderForm(adjInDiv, 'Adjustment In (+)', adjInFields, handleAdjustmentIn);
      gridDiv.appendChild(adjInDiv);

      // Adjustment Out
      const adjOutDiv = document.createElement('div');
      adjOutDiv.className = 'bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card';
      const adjOutFields = `
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${productSelectHtml(products)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`;
      renderForm(adjOutDiv, 'Adjustment Out (-)', adjOutFields, handleAdjustmentOut);
      gridDiv.appendChild(adjOutDiv);

      formsWrapper.innerHTML = titleHtml;
      formsWrapper.appendChild(gridDiv);

      container.innerHTML = '';
      container.appendChild(formsWrapper);
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat data untuk form.';
      renderError(container, msg, load);
    }
  };
  load();
}

