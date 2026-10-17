// src/login.js
import { login } from './auth.js';
import { renderApp } from './layout.js';

export function renderLogin() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-3 sm:p-6">
      <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-elevated p-5 sm:p-8">
        <div class="text-center mb-6 sm:mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <h2 class="font-heading text-xl sm:text-2xl font-bold tracking-tight text-slate-900">PT. Best Engineer Persada</h2>
          <p class="text-xs text-slate-500 mt-1">Sistem Persediaan & Profitabilitas Project</p>
        </div>

        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" for="email">Alamat Email</label>
            <input type="email" id="email" name="email" required placeholder="nama@perusahaan.com" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all min-h-[44px]" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" for="password">Kata Sandi</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all min-h-[44px]" />
          </div>

          <button type="submit" id="submitBtn" class="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-3 px-4 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2 min-h-[44px]">
            <span>Masuk Aplikasi</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>

          <div id="loginError" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium"></div>
        </form>
      </div>
    </div>`;

  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
      await login(email, password);
    } catch (err) {
      const errMsg = err.payload?.message || 'Login failed';
      const errEl = document.getElementById('loginError');
      errEl.textContent = errMsg;
      errEl.classList.remove('hidden');
      return; // stop further processing on login error
    }
    if (window.location.hash === '#/dashboard') {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = '#/dashboard';
    }
  });
}
