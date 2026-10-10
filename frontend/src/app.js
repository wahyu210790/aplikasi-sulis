// src/app.js
/*
  Simple SPA bootstrap for PT. Best Engineer Persada frontend.
  Responsibilities:
  • Show loading indicator while checking authentication.
  • Determine if a stored token is present and valid via /auth/me.
  • Render login page when unauthenticated.
  • Render the main app shell (sidebar + topbar) when authenticated.
  • Handle hash‑based routing with a fallback 404 view.
  • Provide placeholder pages for role‑specific routes.
*/

import { renderLogin } from './login.js';
import { renderApp } from './layout.js';
import { fetchCurrentUser, clearToken } from './auth.js';
import { renderOwnerDashboard } from './dashboardOwner.js';
import { renderWarehouseDashboard } from './dashboardWarehouse.js';
import { renderFinanceDashboard } from './dashboardFinance.js';
import { renderMasterData } from './masterData.js';
import { renderProducts } from './products.js';
import { renderSuppliers } from './suppliers.js';
import { renderInventory } from './inventory.js';
import { renderPurchasing } from './purchasing.js';
import { renderProjects } from './projects.js';
import { renderReports } from './reports.js';
import { renderStockOpname } from './stockOpname.js';

// Simple loading UI
function renderLoading(message = 'Memuat aplikasi...') {
  const app = document.getElementById('app');
  app.innerHTML = `<div class="flex items-center justify-center h-screen bg-background"><p class="text-xl">${message}</p></div>`;
}

// Define allowed routes per role
const ROLE_ROUTES = {
  owner: [
    '/dashboard',
    '/master-data',
    '/products',
    '/categories',
    '/suppliers',
    '/inventory',
    '/purchasing',
    '/projects',
    '/stock-opname',
    '/reports',
  ],
  warehouse: [
    '/dashboard',
    '/products',
    '/inventory',
    '/stock-opname',
  ],
  finance: [
    '/dashboard',
    '/suppliers',
    '/purchasing',
    '/projects',
    '/reports',
  ],
};

// Render a placeholder page for a known route (non‑owner specifics)
function renderPlaceholder(route) {
  const main = document.getElementById('mainContent');
  if (!main) return;
  const title = route.replace(/^\//, '').replace(/-/g, ' ');
  main.innerHTML = `
    <h2 class="text-2xl font-bold mb-4 capitalize">${title}</h2>
    <p class="text-gray-600">Halaman ini belum diimplementasikan.</p>
  `;
}

// Render the 404 / Access Denied view
function renderNotFound() {
  const main = document.getElementById('mainContent');
  if (!main) return;
  main.innerHTML = `
    <h2 class="text-2xl font-bold text-danger mb-4">404 / Akses Ditolak – Halaman tidak ditemukan</h2>
    <p class="mb-4">Halaman yang Anda minta tidak ada atau Anda tidak memiliki izin untuk mengaksesnya.</p>
    <button id="backBtn" class="bg-primary text-white px-4 py-2 rounded hover:bg-dark">Kembali ke Dashboard</button>
  `;
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/dashboard';
    });
  }
}

// Central router handling based on current hash and user role
function handleRoute(user) {
  if (!user) {
    renderLogin();
    return;
  }
  const hash = window.location.hash || '#/dashboard';
  const route = hash.replace('#', '').split('?')[0]; // keep leading slash, ignore query params
  const allowed = ROLE_ROUTES[user.role] || [];

  if (!allowed.includes(route)) {
    renderNotFound();
    return;
  }

  const main = document.getElementById('mainContent');

  if (route === '/dashboard') {
    if (user.role === 'owner') {
      renderOwnerDashboard();
    } else if (user.role === 'warehouse') {
      renderWarehouseDashboard();
    } else if (user.role === 'finance') {
      renderFinanceDashboard();
    } else {
      renderPlaceholder(route);
    }
    return;
  }

  if (route === '/master-data') {
    renderMasterData();
    return;
  }

  if (route === '/products') {
    renderProducts(main);
    return;
  }

  if (route === '/suppliers') {
    renderSuppliers(main);
    return;
  }

  if (route === '/inventory') {
    renderInventory(main);
    return;
  }

  if (route === '/purchasing') {
    renderPurchasing(main);
    return;
  }

  if (route === '/projects') {
    renderProjects(main);
    return;
  }

  if (route === '/stock-opname') {
    renderStockOpname(main);
    return;
  }

  if (route === '/reports') {
    renderReports(main);
    return;
  }

  renderPlaceholder(route);
}

let activeUser = null;

async function navigate() {
  const hash = window.location.hash || '#/dashboard';
  const route = hash.replace('#', '').split('?')[0];

  if (route === '/login') {
    activeUser = null;
    renderLogin();
    return;
  }

  activeUser = await fetchCurrentUser();

  if (!activeUser) {
    window.location.hash = '#/login';
    renderLogin();
    return;
  }

  await renderApp(activeUser);
  handleRoute(activeUser);
}

// Bootstrap the application
async function bootstrap() {
  renderLoading();
  window.addEventListener('hashchange', navigate);
  try {
    await navigate();
  } catch (err) {
    console.error('Bootstrap error message:', err.message, err.stack, err);
    if (err.status === 401) {
      clearToken();
      activeUser = null;
      renderLogin();
    } else if (err.status === 403) {
      renderLoading('Akses ditolak (403).');
    } else if (err.status === 404) {
      renderLoading('Sumber daya tidak ditemukan (404).');
    } else if (err.status === 422) {
      renderLoading('Data tidak valid (422).');
    } else if (err.status >= 500) {
      renderLoading('Kesalahan server. Silakan coba lagi nanti.');
    } else {
      renderLoading('Terjadi kesalahan tak terduga.');
    }
  }
}

// Start the SPA
bootstrap();
