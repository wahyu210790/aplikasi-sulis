import { renderInventoryOverview } from './inventoryOverview.js';
import { renderInventoryMovements } from './inventoryMovements.js';
import { renderInventoryForms } from './inventoryForms.js';
import { renderPageHeader } from './utils.js';

export async function renderInventory(container) {
  if (!container) return;

  const headerHtml = renderPageHeader(
    'Inventory Management',
    'Pantau stok aktual persediaan, riwayat mutasi pergerakan barang, dan catat transaksi stok.'
  );

  const sectionsHtml = `
    <div class="space-y-8">
      <div id="inventoryOverview" class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"></div>
      <div id="inventoryMovements" class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"></div>
      <div id="inventoryForms" class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"></div>
    </div>`;

  container.innerHTML = headerHtml + sectionsHtml;

  const overviewEl = container.querySelector('#inventoryOverview');
  const movementsEl = container.querySelector('#inventoryMovements');
  const formsEl = container.querySelector('#inventoryForms');

  if (overviewEl) renderInventoryOverview(overviewEl);
  if (movementsEl) renderInventoryMovements(movementsEl);
  if (formsEl) renderInventoryForms(formsEl);
}

