// src/layout.js
import { logout, fetchCurrentUser } from './auth.js';

const NAV_ICONS = {
  '/dashboard': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`,
  '/master-data': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zM4 12h16"></path></svg>`,
  '/products': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`,
  '/suppliers': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`,
  '/inventory': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>`,
  '/purchasing': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"></path></svg>`,
  '/projects': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`,
  '/stock-opname': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`,
  '/reports': `<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 00-2-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>`,
};

function navItem(label, href) {
  const icon = NAV_ICONS[href] || '';
  return `
    <li>
      <a href="#${href}" data-nav-href="${href}" class="nav-item-link flex items-center gap-3 px-3.5 py-3 sm:py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
        ${icon}
        <span>${label}</span>
      </a>
    </li>`;
}

function sidebar(role, user) {
  const routes = [
    { label: 'Dashboard', href: '/dashboard' }
  ];

  if (role === 'owner') {
    routes.push(
      { label: 'Master Data', href: '/master-data' },
      { label: 'Inventory', href: '/inventory' },
      { label: 'Purchasing', href: '/purchasing' },
      { label: 'Projects', href: '/projects' },
      { label: 'Stock Opname', href: '/stock-opname' },
      { label: 'Reports', href: '/reports' }
    );
  } else if (role === 'warehouse') {
    routes.push(
      { label: 'Products', href: '/products' },
      { label: 'Inventory', href: '/inventory' },
      { label: 'Stock Opname', href: '/stock-opname' }
    );
  } else if (role === 'finance') {
    routes.push(
      { label: 'Suppliers', href: '/suppliers' },
      { label: 'Purchasing', href: '/purchasing' },
      { label: 'Projects', href: '/projects' },
      { label: 'Reports', href: '/reports' }
    );
  }

  const itemsHtml = routes.map(r => navItem(r.label, r.href)).join('');
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'US';

  return `
    <!-- Mobile Backdrop Overlay -->
    <div id="mobileDrawerBackdrop" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 lg:hidden hidden transition-opacity"></div>

    <!-- Responsive Sidebar Drawer -->
    <aside id="appSidebar" class="fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shrink-0 select-none transform -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-in-out">
      <!-- App Header / Brand -->
      <div class="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30 shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <div class="truncate">
            <h1 class="font-heading text-sm font-bold tracking-tight text-white leading-tight truncate">PT. Best Engineer Persada</h1>
            <span class="inline-block text-[10px] font-semibold uppercase tracking-wider text-blue-400 mt-0.5">${role} PORTAL</span>
          </div>
        </div>
        <!-- Close Mobile Drawer Button -->
        <button id="closeDrawerBtn" aria-label="Tutup Menu" class="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>

      <!-- Nav Links -->
      <div class="flex-1 overflow-y-auto px-3 py-4">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Navigasi Utama</div>
        <ul class="space-y-1">
          ${itemsHtml}
        </ul>
      </div>

      <!-- User Profile Footer -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <div class="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
            ${initials}
          </div>
          <div class="truncate">
            <div class="text-xs font-semibold text-white truncate">${user.name}</div>
            <div class="text-[10px] text-slate-400 capitalize truncate">${user.role}</div>
          </div>
        </div>
        <button id="logoutBtn" title="Keluar Aplikasi" class="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>
    </aside>`;
}

function topbar(user) {
  return `
    <header class="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-card">
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- Hamburger Button for Mobile -->
        <button id="mobileMenuBtn" aria-label="Buka Menu" class="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
        </button>

        <span class="hidden sm:inline-block text-xs font-medium text-slate-400">Inventory System</span>
        <span class="hidden sm:inline-block text-slate-300">/</span>
        <span id="topbarBreadcrumb" class="text-xs font-semibold text-slate-800 capitalize truncate">Dashboard</span>
      </div>
      
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80 max-w-[180px] sm:max-w-none truncate">
          <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span class="truncate">${user.email}</span>
        </span>
      </div>
    </header>`;
}

export function toggleMobileDrawer(show) {
  const sidebarEl = document.getElementById('appSidebar');
  const backdropEl = document.getElementById('mobileDrawerBackdrop');
  if (!sidebarEl || !backdropEl) return;

  if (show === undefined) {
    show = sidebarEl.classList.contains('-translate-x-full');
  }

  if (show) {
    sidebarEl.classList.remove('-translate-x-full');
    backdropEl.classList.remove('hidden');
  } else {
    sidebarEl.classList.add('-translate-x-full');
    backdropEl.classList.add('hidden');
  }
}

export function updateActiveNav() {
  const hash = window.location.hash || '#/dashboard';
  const currentRoute = hash.replace('#', '').split('?')[0];

  document.querySelectorAll('.nav-item-link').forEach(link => {
    const href = link.getAttribute('data-nav-href');
    if (href === currentRoute) {
      link.className = 'nav-item-link flex items-center gap-3 px-3.5 py-3 sm:py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all';
    } else {
      link.className = 'nav-item-link flex items-center gap-3 px-3.5 py-3 sm:py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all';
    }
  });

  const breadcrumb = document.getElementById('topbarBreadcrumb');
  if (breadcrumb) {
    const routeName = currentRoute.replace('/', '').replace(/-/g, ' ');
    breadcrumb.textContent = routeName ? routeName.charAt(0).toUpperCase() + routeName.slice(1) : 'Dashboard';
  }

  // Close mobile drawer on navigation
  toggleMobileDrawer(false);
}

export async function renderApp(existingUser = null) {
  const user = existingUser || (await fetchCurrentUser());
  if (!user) {
    const app = document.getElementById('app');
    app.removeAttribute('data-user-id');
    window.location.hash = '#/login';
    return null;
  }
  const app = document.getElementById('app');
  const currentUserId = app.getAttribute('data-user-id');
  if (currentUserId !== String(user.id)) {
    app.setAttribute('data-user-id', user.id);
    app.innerHTML = `
      <div class="flex h-screen overflow-hidden bg-slate-50">
        ${sidebar(user.role, user)}
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          ${topbar(user)}
          <main id="mainContent" class="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-50 min-w-0"></main>
        </div>
      </div>`;
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        await logout();
        app.removeAttribute('data-user-id');
        window.location.hash = '#/login';
      });
    }

    // Bind Mobile Drawer Controls
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const backdropEl = document.getElementById('mobileDrawerBackdrop');

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => toggleMobileDrawer(true));
    }
    if (closeDrawerBtn) {
      closeDrawerBtn.addEventListener('click', () => toggleMobileDrawer(false));
    }
    if (backdropEl) {
      backdropEl.addEventListener('click', () => toggleMobileDrawer(false));
    }
  }
  updateActiveNav();
  return user;
}
