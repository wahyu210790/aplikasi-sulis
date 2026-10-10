// src/projects.js
/*
  Projects UI – list, create, detail, profitability.
  Role access:
    - owner & finance: full UI
    - warehouse: access denied (no API calls)
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
import { openModal, closeModal } from './modal.js';

// ---------- Main entry point ----------
export async function renderProjects(container) {
  if (!container) return;
  const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
  if (user.role === 'warehouse') {
    container.innerHTML = renderAccessDeniedUI(
      'Proyek & Profitabilitas',
      'Modul ini khusus untuk peran Owner dan Finance. Peran Warehouse tidak memiliki akses.'
    );
    return;
  }

  const headerHtml = renderPageHeader(
    'Proyek & Profitabilitas',
    'Pantau pendapatan proyek, estimasi biaya material, pengeluaran operasional (Other Expenses), dan margin profitabilitas.'
  );

  const tabsHtml = `
    <div class="mb-6 inline-flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner">
      <button data-tab="list" class="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80">
        Daftar Proyek
      </button>
      <button data-tab="new" class="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60">
        + Buat Proyek Baru
      </button>
    </div>`;

  container.innerHTML = headerHtml + tabsHtml + `<div id="projectsContent"></div>`;
  const contentEl = container.querySelector('#projectsContent');

  container.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', async () => {
      container.querySelectorAll('button[data-tab]').forEach(b => {
        b.className = 'px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60';
      });
      btn.className = 'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80';
      
      const tab = btn.getAttribute('data-tab');
      if (tab === 'list') await renderProjectList(contentEl);
      else if (tab === 'new') await renderProjectForm(contentEl);
    });
  });

  await renderProjectList(contentEl);
}

// ---------- Project List ----------
async function renderProjectList(target) {
  let state = {
    search: '',
    status: '',
    sort: 'name',
    direction: 'asc',
    page: 1,
  };

  target.innerHTML = `
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nama proyek..." value="${state.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="statusSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="name-asc">Urut: Nama (A-Z)</option>
            <option value="name-desc">Urut: Nama (Z-A)</option>
            <option value="revenue-desc">Urut: Revenue Tertinggi</option>
            <option value="created_at-desc">Urut: Terbaru</option>
          </select>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="projectsTableContainer"></div>
    </div>`;

  const tableContainer = target.querySelector('#projectsTableContainer');

  const loadData = async () => {
    tableContainer.innerHTML = renderLoadingState('Memuat data proyek...');
    try {
      const queryParams = new URLSearchParams();
      if (state.search) queryParams.append('search', state.search);
      if (state.status) queryParams.append('status', state.status);
      if (state.sort) queryParams.append('sort', state.sort);
      if (state.direction) queryParams.append('direction', state.direction);
      queryParams.append('page', state.page);
      queryParams.append('per_page', 15);

      const resp = await apiClient.get(`/projects?${queryParams.toString()}`);
      const projects = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp) ? resp : []);

      if (projects.length === 0) {
        tableContainer.innerHTML = renderEmptyStateUI(
          'Belum Ada Proyek',
          'Tidak ada proyek yang sesuai dengan kriteria pencarian.'
        );
        return;
      }

      const rows = projects.map(p => {
        let statusBadge = renderBadge(p.status || 'ACTIVE', 'info');
        if (p.status === 'COMPLETED' || p.status === 'completed') statusBadge = renderBadge('COMPLETED', 'success');

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">#${p.id}</td>
            <td class="px-5 py-3.5 text-sm font-semibold text-slate-900">${p.name ?? '-'}</td>
            <td class="px-5 py-3.5 text-sm">${statusBadge}</td>
            <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${p.revenue !== undefined ? formatRupiah(p.revenue) : '-'}</td>
            <td class="px-5 py-3.5 text-sm text-right">
              <button data-action="detail" data-id="${p.id}" class="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                Profitability & Expense &rarr;
              </button>
            </td>
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
                  <th class="px-5 py-3.5">Nama Proyek</th>
                  <th class="px-5 py-3.5">Status</th>
                  <th class="px-5 py-3.5 text-right">Revenue (IDR)</th>
                  <th class="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${rows}</tbody>
            </table>
          </div>
          ${paginationHtml}
        </div>`;

      tableContainer.querySelectorAll('button[data-action="detail"]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await renderProjectDetail(target, id);
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
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat daftar proyek.';
      tableContainer.innerHTML = renderErrorState(msg, loadData);
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

  target.querySelector('#resetFilterBtn').addEventListener('click', () => {
    state.search = '';
    state.status = '';
    state.sort = 'name';
    state.direction = 'asc';
    state.page = 1;

    target.querySelector('#searchInput').value = '';
    target.querySelector('#statusSelect').value = '';
    target.querySelector('#sortSelect').value = 'name-asc';

    loadData();
  });

  await loadData();
}

// ---------- Project Detail (includes profitability & expenses) ----------
async function renderProjectDetail(target, projectId) {
  target.innerHTML = renderLoadingState('Memuat detail & kalkulasi profitabilitas proyek...');
  async function load() {
    try {
      const [projResp, profitResp] = await Promise.all([
        apiClient.get(`/projects/${projectId}`),
        apiClient.get(`/projects/${projectId}/profitability`),
      ]);
      const project = projResp.data ?? projResp;
      const profit = profitResp.data ?? profitResp;
      const user = JSON.parse(localStorage.getItem('auth_user') || '{}');

      const isProfitPositive = (profit.gross_profit || 0) >= 0;
      const marginVal = profit.margin_percent || 0;

      const expensesRows = (profit.expenses || []).map(exp => {
        const actions = user.role !== 'warehouse' ? `
          <button data-action="edit" data-id="${exp.id}" class="text-blue-600 hover:underline font-semibold mr-3">Edit</button>
          <button data-action="delete" data-id="${exp.id}" class="text-rose-600 hover:underline font-semibold">Delete</button>` : '';

        return `
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3 text-sm text-slate-600">${exp.expense_date}</td>
            <td class="px-5 py-3 text-sm font-medium text-slate-800">${exp.description}</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${formatRupiah(exp.amount)}</td>
            <td class="px-5 py-3 text-sm text-right whitespace-nowrap">${actions}</td>
          </tr>`;
      }).join('');

      target.innerHTML = `
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <button id="backBtn" class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 hover:text-slate-900 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
              Kembali ke Daftar Proyek
            </button>
          </div>

          <!-- Project Header Card -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
              <div>
                <div class="flex items-center gap-3">
                  <h3 class="text-xl font-bold text-slate-900 font-poppins">${project.name ?? '-'}</h3>
                  ${renderBadge(project.status || 'ACTIVE', project.status === 'COMPLETED' ? 'success' : 'info')}
                </div>
                <p class="text-sm text-slate-500 mt-1">Project ID: <span class="font-mono font-semibold text-slate-700">#${project.id}</span> ${project.description ? `• ${project.description}` : ''}</p>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Contract Revenue</span>
                <span class="text-2xl font-bold text-slate-900 font-mono">${project.revenue !== undefined ? formatRupiah(project.revenue) : '-'}</span>
              </div>
            </div>

            <!-- Profitability Summary Cards -->
            <div class="mt-6">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Profitability Analysis Summary</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                  <span class="text-xs font-semibold text-slate-500 block mb-1">Material Cost</span>
                  <span class="text-lg font-bold text-slate-900 font-mono">${formatRupiah(profit.material_cost)}</span>
                  <span class="text-xs text-slate-400 block mt-1">Pemakaian barang stok</span>
                </div>

                <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                  <span class="text-xs font-semibold text-slate-500 block mb-1">Other Expenses</span>
                  <span class="text-lg font-bold text-slate-900 font-mono">${formatRupiah(profit.other_expenses)}</span>
                  <span class="text-xs text-slate-400 block mt-1">Pengeluaran non-stok</span>
                </div>

                <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                  <span class="text-xs font-semibold text-slate-500 block mb-1">Total Project Cost</span>
                  <span class="text-lg font-bold text-slate-900 font-mono">${formatRupiah(profit.total_cost)}</span>
                  <span class="text-xs text-slate-400 block mt-1">Material + Expenses</span>
                </div>

                <div class="${isProfitPositive ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-rose-50/60 border-rose-200/60'} border rounded-xl p-4">
                  <span class="text-xs font-semibold ${isProfitPositive ? 'text-emerald-700' : 'text-rose-700'} block mb-1">Gross Profit</span>
                  <span class="text-lg font-bold ${isProfitPositive ? 'text-emerald-700' : 'text-rose-700'} font-mono">${formatRupiah(profit.gross_profit)}</span>
                  <span class="text-xs ${isProfitPositive ? 'text-emerald-600' : 'text-rose-600'} block mt-1">Revenue - Total Cost</span>
                </div>

                <div class="${isProfitPositive ? 'bg-emerald-50/60 border-emerald-200/60' : 'bg-rose-50/60 border-rose-200/60'} border rounded-xl p-4">
                  <span class="text-xs font-semibold ${isProfitPositive ? 'text-emerald-700' : 'text-rose-700'} block mb-1">Margin (%)</span>
                  <span class="text-lg font-bold ${isProfitPositive ? 'text-emerald-700' : 'text-rose-700'} font-mono">${formatPercent(marginVal)}</span>
                  <span class="text-xs ${isProfitPositive ? 'text-emerald-600' : 'text-rose-600'} block mt-1">Gross Profit / Revenue</span>
                </div>

              </div>
            </div>
          </div>

          <!-- Other Project Expenses Table -->
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h4 class="text-base font-bold text-slate-900 font-poppins">Other Project Expenses</h4>
                <p class="text-xs text-slate-500">Daftar biaya operasional khusus proyek ini diluar stok barang.</p>
              </div>
              ${user.role !== 'warehouse' ? `
                <button id="addExpenseBtn" class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                  + Tambah Expense
                </button>` : ''}
            </div>

            ${expensesRows ? `
              <div class="rounded-xl border border-slate-200/80 overflow-hidden">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th class="px-5 py-3">Tanggal</th>
                      <th class="px-5 py-3">Deskripsi / Rincian Biaya</th>
                      <th class="px-5 py-3 text-right">Jumlah Nominal (IDR)</th>
                      <th class="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">${expensesRows}</tbody>
                </table>
              </div>` : `
              <div class="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p class="text-sm font-medium text-slate-600">Belum Ada Other Expense</p>
                <p class="text-xs text-slate-400 mt-1">Klik "+ Tambah Expense" untuk menambahkan pengeluaran proyek.</p>
              </div>`}
          </div>
        </div>`;

      document.getElementById('backBtn').addEventListener('click', () => renderProjectList(target));

      const addBtn = document.getElementById('addExpenseBtn');
      if (addBtn) {
        addBtn.addEventListener('click', () => renderExpenseModal(target, project.id));
      }

      target.querySelectorAll('button[data-action]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const action = btn.getAttribute('data-action');
          const expenseId = btn.getAttribute('data-id');
          if (action === 'edit') {
            const expense = await apiClient.get(`/projects/${project.id}/expenses/${expenseId}`);
            renderExpenseModal(target, project.id, expense);
          } else if (action === 'delete') {
            if (confirm('Apakah Anda yakin ingin menghapus catatan expense ini?')) {
              await apiClient.delete(`/projects/${project.id}/expenses/${expenseId}`);
              await renderProjectDetail(target, project.id);
            }
          }
        });
      });
    } catch (err) {
      const msg = err.status === 401 ? 'Tidak terautentikasi.' : 'Gagal memuat detail & profitabilitas proyek.';
      target.innerHTML = renderErrorState(msg, load);
    }
  }
  await load();
}

// Modal helper for Add / Edit Expense
function renderExpenseModal(target, projectId, expense = null) {
  const isEdit = !!expense;
  const modalContent = `
    <form id="modalExpenseForm" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tanggal Expense</label>
        <input type="date" name="expense_date" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value="${expense?.expense_date || new Date().toISOString().split('T')[0]}" required />
      </div>
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Deskripsi Biaya</label>
        <input type="text" name="description" placeholder="Contoh: Sewa alat berat / Jasa kurir" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value="${expense?.description || ''}" required />
      </div>
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Jumlah Nominal (IDR)</label>
        <input type="number" step="0.01" min="0.01" name="amount" placeholder="0" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" value="${expense?.amount || ''}" required />
      </div>
      <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
        <button type="button" id="closeExpenseModal" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all shadow-sm">
          Batal
        </button>
        <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
          ${isEdit ? 'Perbarui Expense' : 'Simpan Expense'}
        </button>
      </div>
    </form>`;

  openModal({
    title: isEdit ? 'Edit Other Expense' : 'Tambah Other Expense Proyek',
    body: modalContent
  });

  document.getElementById('closeExpenseModal')?.addEventListener('click', closeModal);

  const form = document.getElementById('modalExpenseForm');
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    data.amount = parseFloat(data.amount);

    try {
      if (isEdit) {
        await apiClient.put(`/projects/${projectId}/expenses/${expense.id}`, data);
      } else {
        await apiClient.post(`/projects/${projectId}/expenses`, data);
      }
      closeModal();
      await renderProjectDetail(target, projectId);
    } catch (err) {
      alert(err.payload?.message || 'Gagal menyimpan expense.');
    }
  });
}

// ---------- Create Project Form ----------
async function renderProjectForm(target) {
  target.innerHTML = renderLoadingState('Memuat form pembuatan proyek...');
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
            <h3 class="text-xl font-bold text-slate-900 font-poppins mb-6">Buat Proyek Baru</h3>

            <form id="projectForm" class="space-y-5">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Nama Proyek</label>
                <input type="text" name="name" placeholder="Contoh: Renovasi Gedung Utama A" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" required />
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Status Proyek</label>
                  <select name="status" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                    <option value="PLANNED">PLANNED</option>
                    <option value="IN_PROGRESS" selected>IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Revenue / Nilai Kontrak (IDR)</label>
                  <input type="number" step="0.01" min="0" name="revenue" placeholder="0" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono transition-all" required />
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Deskripsi Proyek (Opsional)</label>
                <textarea name="description" rows="3" placeholder="Tuliskan lingkup pengerjaan atau keterangan proyek..." class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"></textarea>
              </div>

              <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button type="button" id="cancelBtn" class="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-xl transition-all shadow-sm">
                  Batal
                </button>
                <button type="submit" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                  Simpan Proyek
                </button>
              </div>
            </form>
          </div>
        </div>`;

      const backToList = () => renderProjectList(target);
      document.getElementById('backBtn').addEventListener('click', () => renderProjectList(target));
      document.getElementById('cancelBtn').addEventListener('click', () => renderProjectList(target));

      const form = document.getElementById('projectForm');
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form));
        if (!data.name || data.revenue === '' || Number(data.revenue) < 0) {
          alert('Harap isi nama dan nilai revenue proyek dengan valid.');
          return;
        }
        data.revenue = Number(data.revenue);
        try {
          await apiClient.post('/projects', data);
          await renderProjectList(target);
        } catch (err) {
          const msg = err.status === 422 ? 'Validasi gagal.' : 'Gagal menyimpan proyek.';
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

