// src/masterData.js
/*
  Master Data UI – entry point for managing Products, Categories, Suppliers, Projects.
  Uses hash routing "#/master-data" and internal tab navigation.
*/
import { renderProducts } from './products.js';
import { renderCategories } from './categories.js';
import { renderSuppliers } from './suppliers.js';
import { renderProjects } from './projects.js';
import { renderPageHeader, renderLoadingState, renderEmptyStateUI } from './utils.js';

function renderLoading(message = 'Memuat Data Master...') {
  const main = document.getElementById('mainContent');
  if (!main) return;
  main.innerHTML = renderLoadingState(message);
}

function renderTabs(activeTab) {
  const tabs = [
    { id: 'products', label: 'Produk' },
    { id: 'categories', label: 'Kategori' },
    { id: 'suppliers', label: 'Supplier' },
    { id: 'projects', label: 'Project' }
  ];
  
  const tabHtml = tabs.map(tab => {
    const isActive = tab.id === activeTab;
    return `
      <button data-tab="${tab.id}" class="px-3.5 sm:px-4 py-2.5 sm:py-2 text-xs font-semibold rounded-xl whitespace-nowrap shrink-0 min-h-[40px] transition-all ${
        isActive 
          ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80' 
          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
      }">
        ${tab.label}
      </button>`;
  }).join('');

  return `
    <div class="mb-6 bg-slate-200/50 p-1.5 rounded-2xl flex overflow-x-auto gap-1 border border-slate-200/60 no-scrollbar max-w-full">
      ${tabHtml}
    </div>`;
}

export async function renderMasterData() {
  const main = document.getElementById('mainContent');
  if (!main) return;
  const hash = window.location.hash || '#/master-data';
  // Extract optional sub‑tab, e.g. #/master-data?tab=products
  const url = new URL(hash.replace('#', 'http://placeholder'));
  const tabParam = url.searchParams.get('tab') || 'products';
  const headerHtml = renderPageHeader('Master Data Management', 'Kelola katalog produk, kategori barang, data supplier, dan rincian project.');
  main.innerHTML = headerHtml + renderTabs(tabParam);
  // Attach click listeners
  main.querySelectorAll('button[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-tab');
      // Update hash to keep state (optional)
      window.location.hash = `#/master-data?tab=${selected}`;
      renderMasterData(); // re‑render with new tab
    });
  });

  // Render the selected resource below the tabs
  const container = document.createElement('div');
  container.id = 'resourceContainer';
  main.appendChild(container);
  const renderTarget = async () => {
    switch (tabParam) {
      case 'products':
        await renderProducts(container);
        break;
      case 'categories':
        await renderCategories(container);
        break;
      case 'suppliers':
        await renderSuppliers(container);
        break;
      case 'projects':
        await renderProjects(container);
        break;
      default:
        renderEmptyState('Tidak dikenal', 'Tab tidak dikenali.');
    }
  };
  renderTarget();
}
