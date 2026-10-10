var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n=`http://127.0.0.1:8000/api/v1`,r={async request(e,t,r=null){let i={method:e,headers:{Accept:`application/json`,"Content-Type":`application/json`},credentials:`include`},a=localStorage.getItem(`auth_token`);a&&(i.headers.Authorization=`Bearer ${a}`),r&&(i.body=JSON.stringify(r));let o=await fetch(`${n}${t}`,i),s=o.headers.get(`content-type`)||``,c=null;if(c=s.includes(`application/json`)?await o.json():await o.text(),!o.ok){let e=Error(`API error`);throw e.status=o.status,e.payload=c,e}return c},get(e){return this.request(`GET`,e)},post(e,t){return this.request(`POST`,e,t)},put(e,t){return this.request(`PUT`,e,t)},patch(e,t){return this.request(`PATCH`,e,t)},delete(e){return this.request(`DELETE`,e)}},i=t({clearToken:()=>l,fetchCurrentUser:()=>f,getToken:()=>c,login:()=>u,logout:()=>d,setToken:()=>s}),a=`auth_token`,o=`auth_user`;function s(e){localStorage.setItem(a,e)}function c(){return localStorage.getItem(a)}function l(){localStorage.removeItem(a),localStorage.removeItem(o)}async function u(e,t){let n=await r.post(`/auth/login`,{email:e,password:t}),i=n.data.access_token;return s(i),n.data.user&&localStorage.setItem(o,JSON.stringify(n.data.user)),i}async function d(){try{await r.post(`/auth/logout`)}finally{l()}}async function f(){if(!c())return null;try{let e=await r.get(`/auth/me`);return e.data&&localStorage.setItem(o,JSON.stringify(e.data)),e.data}catch(e){throw e.status===401&&l(),e}}var ee={"/dashboard":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>`,"/master-data":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7zM4 12h16"></path></svg>`,"/products":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>`,"/suppliers":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>`,"/inventory":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>`,"/purchasing":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"></path></svg>`,"/projects":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>`,"/stock-opname":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>`,"/reports":`<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>`};function te(e,t){return`
    <li>
      <a href="#${t}" data-nav-href="${t}" class="nav-item-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
        ${ee[t]||``}
        <span>${e}</span>
      </a>
    </li>`}function ne(e,t){let n=[{label:`Dashboard`,href:`/dashboard`}];return e===`owner`?n.push({label:`Master Data`,href:`/master-data`},{label:`Inventory`,href:`/inventory`},{label:`Purchasing`,href:`/purchasing`},{label:`Projects`,href:`/projects`},{label:`Stock Opname`,href:`/stock-opname`},{label:`Reports`,href:`/reports`}):e===`warehouse`?n.push({label:`Products`,href:`/products`},{label:`Inventory`,href:`/inventory`},{label:`Stock Opname`,href:`/stock-opname`}):e===`finance`&&n.push({label:`Suppliers`,href:`/suppliers`},{label:`Purchasing`,href:`/purchasing`},{label:`Projects`,href:`/projects`},{label:`Reports`,href:`/reports`}),`
    <aside class="w-64 bg-slate-900 text-white flex flex-col h-full border-r border-slate-800 shrink-0 select-none">
      <!-- App Header / Brand -->
      <div class="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
        </div>
        <div>
          <h1 class="font-heading text-sm font-bold tracking-tight text-white leading-tight">PT. Best Engineer Persada</h1>
          <span class="inline-block text-[10px] font-semibold uppercase tracking-wider text-blue-400 mt-0.5">${e} PORTAL</span>
        </div>
      </div>

      <!-- Nav Links -->
      <div class="flex-1 overflow-y-auto px-3 py-4">
        <div class="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 mb-2">Navigasi Utama</div>
        <ul class="space-y-1">
          ${n.map(e=>te(e.label,e.href)).join(``)}
        </ul>
      </div>

      <!-- User Profile Footer -->
      <div class="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <div class="flex items-center gap-2.5 overflow-hidden">
          <div class="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs shrink-0">
            ${t.name?t.name.split(` `).map(e=>e[0]).join(``).slice(0,2).toUpperCase():`US`}
          </div>
          <div class="truncate">
            <div class="text-xs font-semibold text-white truncate">${t.name}</div>
            <div class="text-[10px] text-slate-400 capitalize truncate">${t.role}</div>
          </div>
        </div>
        <button id="logoutBtn" title="Keluar Aplikasi" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all shrink-0">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
        </button>
      </div>
    </aside>`}function re(e){return`
    <header class="bg-white border-b border-slate-200/80 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-card">
      <div class="flex items-center gap-3">
        <span class="text-xs font-medium text-slate-400">Inventory & Project System</span>
        <span class="text-slate-300">/</span>
        <span id="topbarBreadcrumb" class="text-xs font-semibold text-slate-700 capitalize">Dashboard</span>
      </div>
      
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">
          <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>${e.email}</span>
        </span>
      </div>
    </header>`}function ie(){let e=(window.location.hash||`#/dashboard`).replace(`#`,``).split(`?`)[0];document.querySelectorAll(`.nav-item-link`).forEach(t=>{t.className=t.getAttribute(`data-nav-href`)===e?`nav-item-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 text-white shadow-sm shadow-blue-600/20 transition-all`:`nav-item-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all`});let t=document.getElementById(`topbarBreadcrumb`);if(t){let n=e.replace(`/`,``).replace(/-/g,` `);t.textContent=n?n.charAt(0).toUpperCase()+n.slice(1):`Dashboard`}}async function ae(e=null){let t=e||await f();if(!t)return document.getElementById(`app`).removeAttribute(`data-user-id`),window.location.hash=`#/login`,null;let n=document.getElementById(`app`);if(n.getAttribute(`data-user-id`)!==String(t.id)){n.setAttribute(`data-user-id`,t.id),n.innerHTML=`
      <div class="flex h-screen overflow-hidden bg-slate-50">
        ${ne(t.role,t)}
        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
          ${re(t)}
          <main id="mainContent" class="p-6 overflow-y-auto flex-1 bg-slate-50"></main>
        </div>
      </div>`;let e=document.getElementById(`logoutBtn`);e&&e.addEventListener(`click`,async()=>{await d(),n.removeAttribute(`data-user-id`),window.location.hash=`#/login`})}return ie(),t}function p(){let e=document.getElementById(`app`);e.innerHTML=`
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-elevated p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/20 mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <h2 class="font-heading text-2xl font-bold tracking-tight text-slate-900">PT. Best Engineer Persada</h2>
          <p class="text-xs text-slate-500 mt-1">Sistem Persediaan & Profitabilitas Project</p>
        </div>

        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" for="email">Alamat Email</label>
            <input type="email" id="email" name="email" required placeholder="nama@perusahaan.com" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" />
          </div>

          <div>
            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5" for="password">Kata Sandi</label>
            <input type="password" id="password" name="password" required placeholder="••••••••" class="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" />
          </div>

          <button type="submit" id="submitBtn" class="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all text-sm flex items-center justify-center gap-2">
            <span>Masuk Aplikasi</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
          </button>

          <div id="loginError" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium"></div>
        </form>
      </div>
    </div>`,document.getElementById(`loginForm`).addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`email`).value,n=document.getElementById(`password`).value;try{await u(t,n)}catch(e){let t=e.payload?.message||`Login failed`,n=document.getElementById(`loginError`);n.textContent=t,n.classList.remove(`hidden`);return}window.location.hash===`#/dashboard`?window.dispatchEvent(new HashChangeEvent(`hashchange`)):window.location.hash=`#/dashboard`})}var m=e=>{if(e==null)return`-`;let t=Number(e);return isNaN(t)?`-`:new Intl.NumberFormat(`id-ID`,{style:`currency`,currency:`IDR`,minimumFractionDigits:0}).format(t)},h=e=>{if(e==null)return`-`;let t=Number(e);return isNaN(t)?`-`:`${t.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,`,`)}%`},g=(e,t=``,n=``)=>`
    <div class="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-slate-200/80">
      <div>
        <h1 class="font-heading text-2xl font-bold tracking-tight text-slate-900">${e}</h1>
        ${t?`<p class="text-sm text-slate-500 mt-1">${t}</p>`:``}
      </div>
      ${n?`<div class="flex items-center gap-2">${n}</div>`:``}
    </div>`,_=e=>{if(!e)return`-`;let t=String(e).toUpperCase(),n=`bg-slate-100 text-slate-700 border-slate-200`;[`CONFIRMED`,`COMPLETED`,`FINISHED`,`SUCCESS`,`ACTIVE`,`PURCHASE_IN`,`ADJUSTMENT_IN`].includes(t)?n=`bg-emerald-50 text-emerald-700 border-emerald-200/80`:[`DRAFT`,`PENDING`,`WARNING`,`STOCK_OUT`].includes(t)?n=`bg-amber-50 text-amber-700 border-amber-200/80`:[`CANCELLED`,`FAILED`,`REJECTED`,`DANGER`,`ADJUSTMENT_OUT`].includes(t)?n=`bg-rose-50 text-rose-700 border-rose-200/80`:[`PROJECT_USAGE`].includes(t)&&(n=`bg-blue-50 text-blue-700 border-blue-200/80`);let r={PURCHASE_IN:`Pembelian Masuk`,PROJECT_USAGE:`Penggunaan Project`,STOCK_OUT:`Stock Keluar`,ADJUSTMENT_IN:`Penyesuaian (+)`,ADJUSTMENT_OUT:`Penyesuaian (-)`}[t]||t;return`<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${n}">${r}</span>`},v=(e=`Memuat data...`)=>`
    <div class="flex flex-col items-center justify-center py-16 px-4">
      <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p class="text-sm font-medium text-slate-500">${e}</p>
    </div>`,y=(e=`Belum Ada Data`,t=`Tidak ada catatan atau item yang dapat ditampilkan.`)=>`
    <div class="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-slate-200/80 shadow-sm my-4">
      <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
      </div>
      <h3 class="text-base font-semibold text-slate-800">${e}</h3>
      <p class="text-sm text-slate-500 mt-1 max-w-sm">${t}</p>
    </div>`,b=(e=`Gagal memuat data`,t)=>`
    <div class="p-6 bg-rose-50/80 border border-rose-200/80 rounded-2xl text-center max-w-md mx-auto my-6">
      <div class="w-10 h-10 rounded-full bg-rose-100 text-rose-600 inline-flex items-center justify-center mb-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <h3 class="text-base font-bold text-rose-900 mb-1">Gagal Memuat Data</h3>
      <p class="text-xs text-rose-700 mb-2">${e}</p>
      ${t?`<button id="retryStateBtn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all mt-2">Coba Lagi</button>`:``}
    </div>`,x=(e=`Akses Ditolak`,t=`Anda tidak memiliki izin untuk mengakses halaman ini.`)=>`
    <div class="p-8 bg-white border border-slate-200/80 rounded-2xl text-center max-w-md mx-auto my-8 shadow-sm">
      <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 inline-flex items-center justify-center mb-3 border border-amber-200/60 mx-auto">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
      </div>
      <h3 class="text-lg font-bold text-slate-900 mb-1 font-poppins">${e}</h3>
      <p class="text-xs text-slate-500 mb-4">${t}</p>
    </div>`,S=(e,t=300)=>{let n;return(...r)=>{clearTimeout(n),n=setTimeout(()=>e(...r),t)}},C=e=>{if(!e||e.total===0)return``;let t=e.current_page||1,n=e.last_page||1,r=e.total||0,i=e.from||(t-1)*(e.per_page||15)+1,a=e.to||Math.min(t*(e.per_page||15),r);return`
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-5 py-3 border-t border-slate-100 text-xs text-slate-500">
      <div>
        Menampilkan <span class="font-semibold text-slate-800 font-mono">${r>0?i:0}</span> - <span class="font-semibold text-slate-800 font-mono">${a}</span> dari <span class="font-semibold text-slate-800 font-mono">${r}</span> item
      </div>
      <div class="flex items-center gap-1.5">
        <button data-page="${t-1}" class="pagination-btn px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs" ${t<=1?`disabled`:``}>
          &larr; Sebelumnya
        </button>
        <span class="px-3 py-1.5 font-mono text-slate-700 font-medium">Halaman ${t} / ${n}</span>
        <button data-page="${t+1}" class="pagination-btn px-3 py-1.5 rounded-xl border border-slate-200/80 bg-white font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs" ${t>=n?`disabled`:``}>
          Berikutnya &rarr;
        </button>
      </div>
    </div>`},oe=`modulepreload`,se=function(e){return`/`+e},ce={},le=function(e){return e.pathname.endsWith(`.css`)},ue=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},w=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=se(t,n);let r=s(t),i=le(r);return ue(ce,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:oe,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{t.addEventListener(`load`,e),t.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${r}`)))})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})};function de(){let e=document.getElementById(`mainContent`);e&&(e.innerHTML=v(`Memuat Dashboard Owner...`))}function T(e,t){let n=document.getElementById(`mainContent`);if(!n)return;n.innerHTML=`
    <div class="p-6 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md my-6">
      <div class="flex items-center gap-3 text-rose-600 mb-2">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3 class="font-semibold text-sm">Gagal Memuat Data</h3>
      </div>
      <p class="text-xs text-slate-600 mb-4">${e}</p>
      <button id="retryBtn" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all">Coba Lagi</button>
    </div>`;let r=document.getElementById(`retryBtn`);r&&r.addEventListener(`click`,t)}function E(e,t,n=``,r=`bg-blue-50 text-blue-700 border-blue-200`){return`
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">${e}</span>
          ${n?`<span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${r}">${n}</span>`:``}
        </div>
        <div class="font-heading text-2xl font-bold text-slate-900 tracking-tight">${t}</div>
      </div>
    </div>`}function fe(e){if(!e){T(`Data dashboard tidak tersedia.`,D);return}let t=document.getElementById(`mainContent`);t&&(t.innerHTML=`
    <div>
      ${g(`Owner Executive Dashboard`,`Pantau seluruh aktivitas persediaan, finansial, dan profitabilitas project secara real-time.`)}
      ${`
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      ${E(`Total Produk`,e.total_products,`Catalog`)}
      ${E(`Total Kuantitas`,e.total_quantity,`Units`)}
      ${E(`Nilai Persediaan`,m(e.total_stock_value),`Inventory`)}
      ${E(`Nilai Pembelian`,m(e.total_purchase_value),`Purchasing`)}
    </div>
    
    <div class="mb-8">
      <h3 class="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Ringkasan Profitabilitas Project</h3>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        ${E(`Total Revenue Project`,m(e.total_revenue),`Revenue`,`bg-emerald-50 text-emerald-700 border-emerald-200`)}
        ${E(`Laba Kotor (Gross Profit)`,m(e.gross_profit),`Profit`,`bg-blue-50 text-blue-700 border-blue-200`)}
        ${E(`Margin Keuntungan`,h(e.overall_margin_percent),`Margin`,`bg-purple-50 text-purple-700 border-purple-200`)}
      </div>
    </div>`}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>${e.recent_purchases&&e.recent_purchases.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Pembelian Terbaru</h3>
          <a href="#/purchasing" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">ID / Tanggal</th>
                <th class="px-5 py-3">Supplier</th>
                <th class="px-5 py-3 text-right">Total Biaya</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_purchases.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 font-medium text-slate-900">${new Date(e.created_at).toLocaleDateString(`id-ID`,{year:`numeric`,month:`short`,day:`numeric`})}</td>
                  <td class="px-5 py-3 text-slate-600">${e.supplier?.name||`-`}</td>
                  <td class="px-5 py-3 text-right font-semibold text-slate-900">${m(e.total_cost??e.total_amount)}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Pembelian Terbaru`,`Belum ada transaksi pembelian tercatat.`)}</div>
        <div>${e.recent_projects&&e.recent_projects.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Project & Margin Terbaru</h3>
          <a href="#/projects" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Nama Project</th>
                <th class="px-5 py-3 text-right">Revenue</th>
                <th class="px-5 py-3 text-right">Total Cost</th>
                <th class="px-5 py-3 text-right">Laba Kotor</th>
                <th class="px-5 py-3 text-right">Margin</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_projects.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 font-semibold text-slate-900">${e.name}</td>
                  <td class="px-5 py-3 text-right">${m(e.revenue)}</td>
                  <td class="px-5 py-3 text-right">${m(e.cost)}</td>
                  <td class="px-5 py-3 text-right font-semibold ${e.gross_profit>=0?`text-emerald-600`:`text-rose-600`}">${m(e.gross_profit)}</td>
                  <td class="px-5 py-3 text-right font-semibold">${h(e.margin)}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Project Terbaru`,`Belum ada data project tercatat.`)}</div>
      </div>
      <div class="mt-8">${e.recent_stock_movements&&e.recent_stock_movements.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Aktivitas Inventory Terbaru</h3>
          <a href="#/inventory" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Tanggal</th>
                <th class="px-5 py-3">Produk</th>
                <th class="px-5 py-3">Tipe Pergerakan</th>
                <th class="px-5 py-3 text-right">Kuantitas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_stock_movements.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-slate-500">${new Date(e.created_at).toLocaleDateString(`id-ID`,{year:`numeric`,month:`short`,day:`numeric`})}</td>
                  <td class="px-5 py-3 font-medium text-slate-900">${e.product?.name||`-`}</td>
                  <td class="px-5 py-3">${_(e.type)}</td>
                  <td class="px-5 py-3 text-right font-semibold text-slate-900">${e.quantity}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Aktivitas Inventory Terbaru`,`Belum ada aktivitas mutasi barang.`)}</div>
    </div>`)}async function D(){de();try{let e=await r.get(`/dashboard/owner`);fe(e.data??e)}catch(e){if(e.status===401){let{clearToken:e}=await w(async()=>{let{clearToken:e}=await Promise.resolve().then(()=>i);return{clearToken:e}},void 0);e(),window.location.hash=`#/login`}else e.status===403?T(`Akses ditolak (403).`,D):T(`Dashboard tidak dapat dimuat.`,D)}}function pe(){let e=document.getElementById(`mainContent`);e&&(e.innerHTML=v(`Memuat Dashboard Warehouse...`))}function me(e,t){let n=document.getElementById(`mainContent`);if(!n)return;n.innerHTML=`
    <div class="p-6 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md my-6">
      <div class="flex items-center gap-3 text-rose-600 mb-2">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3 class="font-semibold text-sm">Gagal Memuat Data</h3>
      </div>
      <p class="text-xs text-slate-600 mb-4">${e}</p>
      <button id="retryBtn" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all">Coba Lagi</button>
    </div>`;let r=document.getElementById(`retryBtn`);r&&r.addEventListener(`click`,t)}function O(e,t,n=``,r=`bg-blue-50 text-blue-700 border-blue-200`){return`
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">${e}</span>
          ${n?`<span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${r}">${n}</span>`:``}
        </div>
        <div class="font-heading text-2xl font-bold text-slate-900 tracking-tight">${t}</div>
      </div>
    </div>`}function he(e){let t=document.getElementById(`mainContent`);t&&(t.innerHTML=`
    <div>
      ${g(`Warehouse Operations Dashboard`,`Kelola stok fisik, pergerakan barang masuk/keluar, dan sesi stock opname.`)}
      ${`
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      ${O(`Total Produk`,e.total_products,`Catalog`)}
      ${O(`Total Kuantitas Fisik`,e.total_quantity,`Total Units`)}
      ${O(`Estimasi Nilai Persediaan`,m(e.total_stock_value),`Valuation`,`bg-emerald-50 text-emerald-700 border-emerald-200`)}
    </div>`}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>${e.recent_stock_movements&&e.recent_stock_movements.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Aktivitas Inventory Terbaru</h3>
          <a href="#/inventory" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Tanggal</th>
                <th class="px-5 py-3">Produk</th>
                <th class="px-5 py-3">Tipe Pergerakan</th>
                <th class="px-5 py-3 text-right">Kuantitas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_stock_movements.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-slate-500">${new Date(e.created_at).toLocaleDateString(`id-ID`,{year:`numeric`,month:`short`,day:`numeric`})}</td>
                  <td class="px-5 py-3 font-medium text-slate-900">${e.product?.name||`-`}</td>
                  <td class="px-5 py-3">${_(e.type)}</td>
                  <td class="px-5 py-3 text-right font-semibold text-slate-900">${e.quantity}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Aktivitas Inventory Terbaru`,`Belum ada mutasi persediaan.`)}</div>
        <div>${e.recent_stock_opnames&&e.recent_stock_opnames.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Stock Opname Terbaru</h3>
          <a href="#/stock-opname" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Kelola Opname →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Nomor Sesi</th>
                <th class="px-5 py-3">Tanggal Opname</th>
                <th class="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_stock_opnames.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 font-semibold text-slate-900">${e.opname_number}</td>
                  <td class="px-5 py-3 text-slate-600">${new Date(e.opname_date).toLocaleDateString(`id-ID`,{year:`numeric`,month:`short`,day:`numeric`})}</td>
                  <td class="px-5 py-3">${_(e.status)}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Stock Opname Terbaru`,`Belum ada sesi pencocokan stok fisik.`)}</div>
      </div>
    </div>`)}async function k(){pe();try{let e=await r.get(`/dashboard/warehouse`);he(e.data??e)}catch(e){if(e.status===401){let{clearToken:e}=await w(async()=>{let{clearToken:e}=await Promise.resolve().then(()=>i);return{clearToken:e}},void 0);e(),window.location.hash=`#/login`}else e.status===403?me(`Akses ditolak (403).`,k):me(`Dashboard tidak dapat dimuat.`,k)}}function ge(){let e=document.getElementById(`mainContent`);e&&(e.innerHTML=v(`Memuat Dashboard Keuangan...`))}function A(e,t){let n=document.getElementById(`mainContent`);if(!n)return;n.innerHTML=`
    <div class="p-6 bg-white rounded-2xl border border-rose-200 shadow-sm max-w-md my-6">
      <div class="flex items-center gap-3 text-rose-600 mb-2">
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        <h3 class="font-semibold text-sm">Gagal Memuat Data</h3>
      </div>
      <p class="text-xs text-slate-600 mb-4">${e}</p>
      <button id="retryBtn" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all">Coba Lagi</button>
    </div>`;let r=document.getElementById(`retryBtn`);r&&r.addEventListener(`click`,t)}function j(e,t,n=``,r=`bg-blue-50 text-blue-700 border-blue-200`){return`
    <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-card flex flex-col justify-between">
      <div>
        <div class="flex items-center justify-between gap-2 mb-2">
          <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-500">${e}</span>
          ${n?`<span class="text-[10px] font-medium px-2 py-0.5 rounded-full border ${r}">${n}</span>`:``}
        </div>
        <div class="font-heading text-2xl font-bold text-slate-900 tracking-tight">${t}</div>
      </div>
    </div>`}function _e(e){let t=document.getElementById(`mainContent`);t&&(t.innerHTML=`
    <div>
      ${g(`Finance Overview Dashboard`,`Pantau arus kas pembelian, pengeluaran project, revenue, dan margin profitabilitas.`)}
      ${`
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      ${j(`Total Pembelian`,m(e.total_purchase_value),`Purchases`)}
      ${j(`Total Revenue`,m(e.total_revenue),`Revenue`,`bg-emerald-50 text-emerald-700 border-emerald-200`)}
      ${j(`Laba Kotor`,m(e.gross_profit),`Gross Profit`,`bg-blue-50 text-blue-700 border-blue-200`)}
      ${j(`Margin Persen`,h(e.overall_margin_percent),`Margin`,`bg-purple-50 text-purple-700 border-purple-200`)}
    </div>`}
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>${e.recent_purchases&&e.recent_purchases.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Pembelian Terbaru</h3>
          <a href="#/purchasing" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Tanggal</th>
                <th class="px-5 py-3">Supplier</th>
                <th class="px-5 py-3 text-right">Total Biaya</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_purchases.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 font-medium text-slate-900">${new Date(e.created_at).toLocaleDateString(`id-ID`,{year:`numeric`,month:`short`,day:`numeric`})}</td>
                  <td class="px-5 py-3 text-slate-600">${e.supplier?.name||`-`}</td>
                  <td class="px-5 py-3 text-right font-semibold text-slate-900">${m(e.total_cost??e.total_amount)}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Pembelian Terbaru`,`Belum ada pembelian terbaru.`)}</div>
        <div>${e.recent_expenses&&e.recent_expenses.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Pengeluaran Project Terbaru</h3>
          <a href="#/projects" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Tanggal</th>
                <th class="px-5 py-3">Deskripsi / Project</th>
                <th class="px-5 py-3 text-right">Jumlah Biaya</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_expenses.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-slate-500">${new Date(e.created_at).toLocaleDateString(`id-ID`,{year:`numeric`,month:`short`,day:`numeric`})}</td>
                  <td class="px-5 py-3 font-medium text-slate-900">${e.description||`Other Project Expense`}</td>
                  <td class="px-5 py-3 text-right font-semibold text-rose-600">${m(e.amount)}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Biaya Terbaru`,`Belum ada pengeluaran project terbaru.`)}</div>
        <div>${e.recent_projects&&e.recent_projects.length?`<div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden mb-8">
        <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Project Terbaru</h3>
          <a href="#/projects" class="text-xs font-semibold text-blue-600 hover:text-blue-700">Lihat Semua →</a>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs text-left border-collapse">
            <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th class="px-5 py-3">Nama Project</th>
                <th class="px-5 py-3 text-right">Revenue</th>
                <th class="px-5 py-3 text-right">Laba Kotor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-slate-700">
              ${e.recent_projects.map(e=>`
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 font-semibold text-slate-900">${e.name}</td>
                  <td class="px-5 py-3 text-right font-medium">${m(e.revenue)}</td>
                  <td class="px-5 py-3 text-right font-semibold ${e.gross_profit>=0?`text-emerald-600`:`text-rose-600`}">${m(e.gross_profit)}</td>
                </tr>`).join(``)}
            </tbody>
          </table>
        </div>
      </div>`:y(`Project Terbaru`,`Belum ada project terbaru.`)}</div>
      </div>
    </div>`)}async function M(){ge();try{let e=await r.get(`/dashboard/finance`);_e(e.data??e)}catch(e){if(e.status===401){let{clearToken:e}=await w(async()=>{let{clearToken:e}=await Promise.resolve().then(()=>i);return{clearToken:e}},void 0);e(),window.location.hash=`#/login`}else e.status===403?A(`Akses ditolak (403).`,M):A(`Dashboard tidak dapat dimuat.`,M)}}async function N(e){let t={search:``,category_id:``,sort:`name`,direction:`asc`,page:1},n=[];try{let e=await r.get(`/categories?per_page=100`);n=Array.isArray(e.data)?e.data:Array.isArray(e)?e:[]}catch{}let i=n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``);e.innerHTML=`
    <div class="space-y-4">
      <!-- Filter Bar -->
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nama atau kode produk..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="categorySelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Kategori</option>
            ${i}
          </select>
          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="name-asc">Urut: Nama (A-Z)</option>
            <option value="name-desc">Urut: Nama (Z-A)</option>
            <option value="code-asc">Urut: Kode (Asc)</option>
            <option value="created_at-desc">Urut: Terbaru</option>
          </select>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="productsTableContainer"></div>
    </div>`;let a=e.querySelector(`#productsTableContainer`),o=async()=>{a.innerHTML=v(`Memuat katalog produk...`);try{let e=new URLSearchParams;t.search&&e.append(`search`,t.search),t.category_id&&e.append(`category_id`,t.category_id),t.sort&&e.append(`sort`,t.sort),t.direction&&e.append(`direction`,t.direction),e.append(`page`,t.page),e.append(`per_page`,15);let n=await r.get(`/products?${e.toString()}`),i=Array.isArray(n.data)?n.data:Array.isArray(n)?n:[];if(i.length===0){a.innerHTML=y(`Katalog Produk Kosong`,`Tidak ada produk yang sesuai dengan kriteria pencarian.`);return}let s=i.map(e=>{let t=e.stock?.quantity??e.quantity??0;return`
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">${e.code||`#${e.id}`}</td>
            <td class="px-5 py-3.5 font-medium text-slate-900">${e.name??e.title??`-`}</td>
            <td class="px-5 py-3.5 text-slate-600"><span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/80">${e.category?.name??`Umum`}</span></td>
            <td class="px-5 py-3.5 text-right font-semibold text-slate-900">${m(e.price??0)}</td>
            <td class="px-5 py-3.5 text-right font-semibold text-slate-900">${t}</td>
          </tr>`}).join(``),c=C(n);a.innerHTML=`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Kode / ID</th>
                  <th class="px-5 py-3">Nama Produk</th>
                  <th class="px-5 py-3">Kategori</th>
                  <th class="px-5 py-3 text-right">Harga Satuan</th>
                  <th class="px-5 py-3 text-right">Stok Fisik</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">${s}</tbody>
            </table>
          </div>
          ${c}
        </div>`,a.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,o())})})}catch(e){let t=e.status===401?`Tidak terautentikasi.`:`Gagal memuat data produk.`;a.innerHTML=`<div class="p-6 text-center text-xs text-rose-600">${t}</div>`}},s=S(e=>{t.search=e,t.page=1,o()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>s(e.target.value.trim())),e.querySelector(`#categorySelect`).addEventListener(`change`,e=>{t.category_id=e.target.value,t.page=1,o()}),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,o()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.category_id=``,t.sort=`name`,t.direction=`asc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#categorySelect`).value=``,e.querySelector(`#sortSelect`).value=`name-asc`,o()}),o()}async function ve(e){let t={search:``,sort:`name`,direction:`asc`,page:1};e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nama kategori..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="name-asc">Urut: Nama (A-Z)</option>
            <option value="name-desc">Urut: Nama (Z-A)</option>
            <option value="created_at-desc">Urut: Terbaru</option>
          </select>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="categoriesTableContainer"></div>
    </div>`;let n=e.querySelector(`#categoriesTableContainer`),i=async()=>{n.innerHTML=v(`Memuat data kategori...`);try{let e=new URLSearchParams;t.search&&e.append(`search`,t.search),t.sort&&e.append(`sort`,t.sort),t.direction&&e.append(`direction`,t.direction),e.append(`page`,t.page),e.append(`per_page`,15);let a=await r.get(`/categories?${e.toString()}`),o=Array.isArray(a.data)?a.data:Array.isArray(a)?a:[];if(o.length===0){n.innerHTML=y(`Belum Ada Kategori`,`Tidak ada kategori yang sesuai pencarian.`);return}let s=o.map(e=>`
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">#${e.id}</td>
          <td class="px-5 py-3.5 font-medium text-slate-900">${e.name??`-`}</td>
          <td class="px-5 py-3.5 text-slate-500 text-xs">${e.description??`-`}</td>
        </tr>`).join(``),c=C(a);n.innerHTML=`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">ID</th>
                  <th class="px-5 py-3">Nama Kategori</th>
                  <th class="px-5 py-3">Deskripsi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">${s}</tbody>
            </table>
          </div>
          ${c}
        </div>`,n.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,i())})})}catch(e){let t=e.status===401?`Tidak terautentikasi.`:`Gagal memuat data kategori.`;n.innerHTML=`<div class="p-6 text-center text-xs text-rose-600">${t}</div>`}},a=S(e=>{t.search=e,t.page=1,i()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>a(e.target.value.trim())),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,i()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.sort=`name`,t.direction=`asc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#sortSelect`).value=`name-asc`,i()}),i()}async function P(e){let t={search:``,sort:`name`,direction:`asc`,page:1};e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nama atau kode supplier..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="name-asc">Urut: Nama (A-Z)</option>
            <option value="name-desc">Urut: Nama (Z-A)</option>
            <option value="code-asc">Urut: Kode (Asc)</option>
            <option value="created_at-desc">Urut: Terbaru</option>
          </select>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="suppliersTableContainer"></div>
    </div>`;let n=e.querySelector(`#suppliersTableContainer`),i=async()=>{n.innerHTML=v(`Memuat data supplier...`);try{let e=new URLSearchParams;t.search&&e.append(`search`,t.search),t.sort&&e.append(`sort`,t.sort),t.direction&&e.append(`direction`,t.direction),e.append(`page`,t.page),e.append(`per_page`,15);let a=await r.get(`/suppliers?${e.toString()}`),o=Array.isArray(a.data)?a.data:Array.isArray(a)?a:[];if(o.length===0){n.innerHTML=y(`Belum Ada Supplier`,`Tidak ada supplier yang sesuai pencarian.`);return}let s=o.map(e=>`
        <tr class="hover:bg-slate-50/80 transition-colors">
          <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">${e.code||`#${e.id}`}</td>
          <td class="px-5 py-3.5 font-medium text-slate-900">${e.name??`-`}</td>
          <td class="px-5 py-3.5 text-slate-600 text-xs">${e.phone??e.email??`-`}</td>
        </tr>`).join(``),c=C(a);n.innerHTML=`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Kode / ID</th>
                  <th class="px-5 py-3">Nama Supplier</th>
                  <th class="px-5 py-3">Kontak</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">${s}</tbody>
            </table>
          </div>
          ${c}
        </div>`,n.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,i())})})}catch(e){let t=e.status===401?`Tidak terautentikasi.`:`Gagal memuat data supplier.`;n.innerHTML=`<div class="p-6 text-center text-xs text-rose-600">${t}</div>`}},a=S(e=>{t.search=e,t.page=1,i()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>a(e.target.value.trim())),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,i()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.sort=`name`,t.direction=`asc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#sortSelect`).value=`name-asc`,i()}),i()}function ye(e){F();let t=document.createElement(`div`);t.id=`modalOverlay`,t.className=`fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200`;let n=document.createElement(`div`);n.className=`bg-white rounded-2xl shadow-elevated border border-slate-200/80 max-w-lg w-full p-6 overflow-hidden relative transform transition-all`,n.innerHTML=e,t.appendChild(n),document.body.appendChild(t),t.addEventListener(`click`,e=>{e.target===t&&F()})}function F(){let e=document.getElementById(`modalOverlay`);e&&e.remove()}async function I(e){if(!e)return;if(JSON.parse(localStorage.getItem(`auth_user`)||`{}`).role===`warehouse`){e.innerHTML=x(`Proyek & Profitabilitas`,`Modul ini khusus untuk peran Owner dan Finance. Peran Warehouse tidak memiliki akses.`);return}e.innerHTML=g(`Proyek & Profitabilitas`,`Pantau pendapatan proyek, estimasi biaya material, pengeluaran operasional (Other Expenses), dan margin profitabilitas.`)+`
    <div class="mb-6 inline-flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner">
      <button data-tab="list" class="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80">
        Daftar Proyek
      </button>
      <button data-tab="new" class="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60">
        + Buat Proyek Baru
      </button>
    </div><div id="projectsContent"></div>`;let t=e.querySelector(`#projectsContent`);e.querySelectorAll(`button[data-tab]`).forEach(n=>{n.addEventListener(`click`,async()=>{e.querySelectorAll(`button[data-tab]`).forEach(e=>{e.className=`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60`}),n.className=`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80`;let r=n.getAttribute(`data-tab`);r===`list`?await L(t):r===`new`&&await be(t)})}),await L(t)}async function L(e){let t={search:``,status:``,sort:`name`,direction:`asc`,page:1};e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nama proyek..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
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
    </div>`;let n=e.querySelector(`#projectsTableContainer`),i=async()=>{n.innerHTML=v(`Memuat data proyek...`);try{let a=new URLSearchParams;t.search&&a.append(`search`,t.search),t.status&&a.append(`status`,t.status),t.sort&&a.append(`sort`,t.sort),t.direction&&a.append(`direction`,t.direction),a.append(`page`,t.page),a.append(`per_page`,15);let o=await r.get(`/projects?${a.toString()}`),s=Array.isArray(o.data)?o.data:Array.isArray(o)?o:[];if(s.length===0){n.innerHTML=y(`Belum Ada Proyek`,`Tidak ada proyek yang sesuai dengan kriteria pencarian.`);return}let c=s.map(e=>{let t=_(e.status||`ACTIVE`,`info`);return(e.status===`COMPLETED`||e.status===`completed`)&&(t=_(`COMPLETED`,`success`)),`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">#${e.id}</td>
            <td class="px-5 py-3.5 text-sm font-semibold text-slate-900">${e.name??`-`}</td>
            <td class="px-5 py-3.5 text-sm">${t}</td>
            <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${e.revenue===void 0?`-`:m(e.revenue)}</td>
            <td class="px-5 py-3.5 text-sm text-right">
              <button data-action="detail" data-id="${e.id}" class="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline">
                Profitability & Expense &rarr;
              </button>
            </td>
          </tr>`}).join(``),l=C(o);n.innerHTML=`
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
              <tbody class="divide-y divide-slate-100">${c}</tbody>
            </table>
          </div>
          ${l}
        </div>`,n.querySelectorAll(`button[data-action="detail"]`).forEach(t=>{t.addEventListener(`click`,async()=>{await R(e,t.getAttribute(`data-id`))})}),n.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,i())})})}catch(e){let t=e.status===401?`Tidak terautentikasi.`:`Gagal memuat daftar proyek.`;n.innerHTML=b(t,i)}},a=S(e=>{t.search=e,t.page=1,i()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>a(e.target.value.trim())),e.querySelector(`#statusSelect`).addEventListener(`change`,e=>{t.status=e.target.value,t.page=1,i()}),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,i()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.status=``,t.sort=`name`,t.direction=`asc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#statusSelect`).value=``,e.querySelector(`#sortSelect`).value=`name-asc`,i()}),await i()}async function R(e,t){e.innerHTML=v(`Memuat detail & kalkulasi profitabilitas proyek...`);async function n(){try{let[n,i]=await Promise.all([r.get(`/projects/${t}`),r.get(`/projects/${t}/profitability`)]),a=n.data??n,o=i.data??i,s=JSON.parse(localStorage.getItem(`auth_user`)||`{}`),c=(o.gross_profit||0)>=0,l=o.margin_percent||0,u=(o.expenses||[]).map(e=>{let t=s.role===`warehouse`?``:`
          <button data-action="edit" data-id="${e.id}" class="text-blue-600 hover:underline font-semibold mr-3">Edit</button>
          <button data-action="delete" data-id="${e.id}" class="text-rose-600 hover:underline font-semibold">Delete</button>`;return`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3 text-sm text-slate-600">${e.expense_date}</td>
            <td class="px-5 py-3 text-sm font-medium text-slate-800">${e.description}</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${m(e.amount)}</td>
            <td class="px-5 py-3 text-sm text-right whitespace-nowrap">${t}</td>
          </tr>`}).join(``);e.innerHTML=`
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
                  <h3 class="text-xl font-bold text-slate-900 font-poppins">${a.name??`-`}</h3>
                  ${_(a.status||`ACTIVE`,a.status===`COMPLETED`?`success`:`info`)}
                </div>
                <p class="text-sm text-slate-500 mt-1">Project ID: <span class="font-mono font-semibold text-slate-700">#${a.id}</span> ${a.description?`• ${a.description}`:``}</p>
              </div>
              <div class="text-right">
                <span class="text-xs text-slate-400 uppercase tracking-wider block font-semibold">Contract Revenue</span>
                <span class="text-2xl font-bold text-slate-900 font-mono">${a.revenue===void 0?`-`:m(a.revenue)}</span>
              </div>
            </div>

            <!-- Profitability Summary Cards -->
            <div class="mt-6">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Profitability Analysis Summary</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                
                <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                  <span class="text-xs font-semibold text-slate-500 block mb-1">Material Cost</span>
                  <span class="text-lg font-bold text-slate-900 font-mono">${m(o.material_cost)}</span>
                  <span class="text-xs text-slate-400 block mt-1">Pemakaian barang stok</span>
                </div>

                <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                  <span class="text-xs font-semibold text-slate-500 block mb-1">Other Expenses</span>
                  <span class="text-lg font-bold text-slate-900 font-mono">${m(o.other_expenses)}</span>
                  <span class="text-xs text-slate-400 block mt-1">Pengeluaran non-stok</span>
                </div>

                <div class="bg-slate-50/80 border border-slate-100 rounded-xl p-4">
                  <span class="text-xs font-semibold text-slate-500 block mb-1">Total Project Cost</span>
                  <span class="text-lg font-bold text-slate-900 font-mono">${m(o.total_cost)}</span>
                  <span class="text-xs text-slate-400 block mt-1">Material + Expenses</span>
                </div>

                <div class="${c?`bg-emerald-50/60 border-emerald-200/60`:`bg-rose-50/60 border-rose-200/60`} border rounded-xl p-4">
                  <span class="text-xs font-semibold ${c?`text-emerald-700`:`text-rose-700`} block mb-1">Gross Profit</span>
                  <span class="text-lg font-bold ${c?`text-emerald-700`:`text-rose-700`} font-mono">${m(o.gross_profit)}</span>
                  <span class="text-xs ${c?`text-emerald-600`:`text-rose-600`} block mt-1">Revenue - Total Cost</span>
                </div>

                <div class="${c?`bg-emerald-50/60 border-emerald-200/60`:`bg-rose-50/60 border-rose-200/60`} border rounded-xl p-4">
                  <span class="text-xs font-semibold ${c?`text-emerald-700`:`text-rose-700`} block mb-1">Margin (%)</span>
                  <span class="text-lg font-bold ${c?`text-emerald-700`:`text-rose-700`} font-mono">${h(l)}</span>
                  <span class="text-xs ${c?`text-emerald-600`:`text-rose-600`} block mt-1">Gross Profit / Revenue</span>
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
              ${s.role===`warehouse`?``:`
                <button id="addExpenseBtn" class="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                  + Tambah Expense
                </button>`}
            </div>

            ${u?`
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
                  <tbody class="divide-y divide-slate-100">${u}</tbody>
                </table>
              </div>`:`
              <div class="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p class="text-sm font-medium text-slate-600">Belum Ada Other Expense</p>
                <p class="text-xs text-slate-400 mt-1">Klik "+ Tambah Expense" untuk menambahkan pengeluaran proyek.</p>
              </div>`}
          </div>
        </div>`,document.getElementById(`backBtn`).addEventListener(`click`,()=>L(e));let d=document.getElementById(`addExpenseBtn`);d&&d.addEventListener(`click`,()=>z(e,a.id)),e.querySelectorAll(`button[data-action]`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.getAttribute(`data-action`),i=t.getAttribute(`data-id`);if(n===`edit`){let t=await r.get(`/projects/${a.id}/expenses/${i}`);z(e,a.id,t)}else n===`delete`&&confirm(`Apakah Anda yakin ingin menghapus catatan expense ini?`)&&(await r.delete(`/projects/${a.id}/expenses/${i}`),await R(e,a.id))})})}catch(t){e.innerHTML=b(t.status===401?`Tidak terautentikasi.`:`Gagal memuat detail & profitabilitas proyek.`,n)}}await n()}function z(e,t,n=null){let i=!!n,a=`
    <form id="modalExpenseForm" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tanggal Expense</label>
        <input type="date" name="expense_date" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value="${n?.expense_date||new Date().toISOString().split(`T`)[0]}" required />
      </div>
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Deskripsi Biaya</label>
        <input type="text" name="description" placeholder="Contoh: Sewa alat berat / Jasa kurir" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" value="${n?.description||``}" required />
      </div>
      <div>
        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Jumlah Nominal (IDR)</label>
        <input type="number" step="0.01" min="0.01" name="amount" placeholder="0" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono" value="${n?.amount||``}" required />
      </div>
      <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
        <button type="button" id="closeExpenseModal" class="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-all shadow-sm">
          Batal
        </button>
        <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
          ${i?`Perbarui Expense`:`Simpan Expense`}
        </button>
      </div>
    </form>`;ye({title:i?`Edit Other Expense`:`Tambah Other Expense Proyek`,body:a}),document.getElementById(`closeExpenseModal`)?.addEventListener(`click`,F);let o=document.getElementById(`modalExpenseForm`);o?.addEventListener(`submit`,async a=>{a.preventDefault();let s=Object.fromEntries(new FormData(o));s.amount=parseFloat(s.amount);try{i?await r.put(`/projects/${t}/expenses/${n.id}`,s):await r.post(`/projects/${t}/expenses`,s),F(),await R(e,t)}catch(e){alert(e.payload?.message||`Gagal menyimpan expense.`)}})}async function be(e){e.innerHTML=v(`Memuat form pembuatan proyek...`);async function t(){try{e.innerHTML=`
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
        </div>`,document.getElementById(`backBtn`).addEventListener(`click`,()=>L(e)),document.getElementById(`cancelBtn`).addEventListener(`click`,()=>L(e));let n=document.getElementById(`projectForm`);n.addEventListener(`submit`,async i=>{i.preventDefault();let a=Object.fromEntries(new FormData(n));if(!a.name||a.revenue===``||Number(a.revenue)<0)alert(`Harap isi nama dan nilai revenue proyek dengan valid.`);else{a.revenue=Number(a.revenue);try{await r.post(`/projects`,a),await L(e)}catch(n){e.innerHTML=b(n.status===422?`Validasi gagal.`:`Gagal menyimpan proyek.`,t)}}})}catch(n){e.innerHTML=b(n.status===401?`Tidak terautentikasi.`:`Gagal memuat form.`,t)}}await t()}function xe(e){return`
    <div class="mb-6 bg-slate-200/50 p-1.5 rounded-2xl inline-flex items-center gap-1 border border-slate-200/60">
      ${[{id:`products`,label:`Produk`},{id:`categories`,label:`Kategori`},{id:`suppliers`,label:`Supplier`},{id:`projects`,label:`Project`}].map(t=>{let n=t.id===e;return`
      <button data-tab="${t.id}" class="px-4 py-2 text-xs font-semibold rounded-xl transition-all ${n?`bg-white text-blue-600 shadow-sm border border-slate-200/80`:`text-slate-600 hover:text-slate-900 hover:bg-slate-200/60`}">
        ${t.label}
      </button>`}).join(``)}
    </div>`}async function B(){let e=document.getElementById(`mainContent`);if(!e)return;let t=window.location.hash||`#/master-data`,n=new URL(t.replace(`#`,`http://placeholder`)).searchParams.get(`tab`)||`products`;e.innerHTML=g(`Master Data Management`,`Kelola katalog produk, kategori barang, data supplier, dan rincian project.`)+xe(n),e.querySelectorAll(`button[data-tab]`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);window.location.hash=`#/master-data?tab=${t}`,B()})});let r=document.createElement(`div`);r.id=`resourceContainer`,e.appendChild(r),(async()=>{switch(n){case`products`:await N(r);break;case`categories`:await ve(r);break;case`suppliers`:await P(r);break;case`projects`:await I(r);break;default:renderEmptyState(`Tidak dikenal`,`Tab tidak dikenali.`)}})()}async function V(e){if(!e)return;let t={search:``,category_id:``,low_stock:``,sort:`product_name`,direction:`asc`,page:1},n=[];try{let e=await r.get(`/categories?per_page=100`);n=Array.isArray(e.data)?e.data:Array.isArray(e)?e:[]}catch{}let i=n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``);e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1 max-w-md">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari produk atau kode..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>
          <select id="categorySelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Kategori</option>
            ${i}
          </select>
          <select id="lowStockSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Stok</option>
            <option value="1">Stok Menipis (&le; 5)</option>
            <option value="0">Stok Normal (&gt; 5)</option>
          </select>
          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="product_name-asc">Urut: Nama Produk</option>
            <option value="quantity-desc">Urut: Kuantitas (Terbanyak)</option>
            <option value="quantity-asc">Urut: Kuantitas (Tersedikit)</option>
            <option value="total_value-desc">Urut: Total Valuation</option>
          </select>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="overviewTableContainer"></div>
    </div>`;let a=e.querySelector(`#overviewTableContainer`),o=async()=>{a.innerHTML=v(`Memuat stok persediaan...`);try{let e=new URLSearchParams;t.search&&e.append(`search`,t.search),t.category_id&&e.append(`category_id`,t.category_id),t.low_stock!==``&&e.append(`low_stock`,t.low_stock),t.sort&&e.append(`sort`,t.sort),t.direction&&e.append(`direction`,t.direction),e.append(`page`,t.page),e.append(`per_page`,15);let n=await r.get(`/inventory/stocks?${e.toString()}`),i=Array.isArray(n?.data)?n.data:Array.isArray(n)?n:[];if(i.length===0){a.innerHTML=y(`Stok Fisik Kosong`,`Tidak ada data stok yang sesuai pencarian.`);return}let s=i.map(e=>{let t=e.product?.code??`#${e.product_id}`,n=e.product?.name??`-`,r=Number(e.quantity??0),i=m(e.average_cost??0),a=m(e.total_value??0),o=r<=5;return`
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-[11px] font-semibold text-slate-500">${t}</td>
            <td class="px-5 py-3.5 font-medium text-slate-900">${n}</td>
            <td class="px-5 py-3.5 text-right font-semibold ${o?`text-rose-600 font-bold`:`text-slate-900`}">${r} ${o?`<span class="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 px-1.5 py-0.5 rounded-md ml-1">Menipis</span>`:``}</td>
            <td class="px-5 py-3.5 text-right font-medium text-slate-700">${i}</td>
            <td class="px-5 py-3.5 text-right font-bold text-slate-900">${a}</td>
          </tr>`}).join(``),c=C(n);a.innerHTML=`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Kode</th>
                  <th class="px-5 py-3">Nama Produk</th>
                  <th class="px-5 py-3 text-right">Kuantitas</th>
                  <th class="px-5 py-3 text-right">Average Cost</th>
                  <th class="px-5 py-3 text-right">Total Valuation</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">${s}</tbody>
            </table>
          </div>
          ${c}
        </div>`,a.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,o())})})}catch(e){let t=e.status===401?`Tidak terautentikasi.`:`Gagal memuat data stok.`;a.innerHTML=`<div class="p-6 text-center text-xs text-rose-600">${t}</div>`}},s=S(e=>{t.search=e,t.page=1,o()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>s(e.target.value.trim())),e.querySelector(`#categorySelect`).addEventListener(`change`,e=>{t.category_id=e.target.value,t.page=1,o()}),e.querySelector(`#lowStockSelect`).addEventListener(`change`,e=>{t.low_stock=e.target.value,t.page=1,o()}),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,o()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.category_id=``,t.low_stock=``,t.sort=`product_name`,t.direction=`asc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#categorySelect`).value=``,e.querySelector(`#lowStockSelect`).value=``,e.querySelector(`#sortSelect`).value=`product_name-asc`,o()}),o()}function Se(e){if(!e)return`-`;let t=new Date(e);return isNaN(t.getTime())?String(e):t.toLocaleDateString(`id-ID`,{year:`numeric`,month:`short`,day:`numeric`})}async function H(e){if(!e)return;let t={search:``,type:``,project_id:``,date_from:``,date_to:``,sort:`transaction_date`,direction:`desc`,page:1},n=[];try{let e=await r.get(`/projects?per_page=100`);n=Array.isArray(e.data)?e.data:Array.isArray(e)?e:[]}catch{}let i=n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``);e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari produk / kode..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>

          <select id="typeSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Tipe Movement</option>
            <option value="PURCHASE_IN">Pembelian Masuk (PURCHASE_IN)</option>
            <option value="PROJECT_USAGE">Penggunaan Proyek (PROJECT_USAGE)</option>
            <option value="STOCK_OUT">Stok Keluar (STOCK_OUT)</option>
            <option value="ADJUSTMENT_IN">Penyesuaian (+)</option>
            <option value="ADJUSTMENT_OUT">Penyesuaian (-)</option>
          </select>

          <select id="projectSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Proyek</option>
            ${i}
          </select>

          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="transaction_date-desc">Urut: Tanggal (Terbaru)</option>
            <option value="transaction_date-asc">Urut: Tanggal (Terlama)</option>
            <option value="quantity-desc">Urut: Kuantitas (Terbanyak)</option>
            <option value="total_cost-desc">Urut: Total Cost (Tertinggi)</option>
          </select>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">Periode:</label>
            <input type="date" id="dateFromInput" value="${t.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${t.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
          </div>

          <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Reset Filter
          </button>
        </div>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="movementsTableContainer"></div>
    </div>`;let a=e.querySelector(`#movementsTableContainer`),o=e.querySelector(`#dateValidationError`),s=async()=>{if(t.date_from&&t.date_to&&t.date_from>t.date_to)o.classList.remove(`hidden`);else{o.classList.add(`hidden`),a.innerHTML=v(`Memuat mutasi pergerakan...`);try{let e=new URLSearchParams;t.search&&e.append(`search`,t.search),t.type&&e.append(`type`,t.type),t.project_id&&e.append(`project_id`,t.project_id),t.date_from&&e.append(`date_from`,t.date_from),t.date_to&&e.append(`date_to`,t.date_to),t.sort&&e.append(`sort`,t.sort),t.direction&&e.append(`direction`,t.direction),e.append(`page`,t.page),e.append(`per_page`,15);let n=await r.get(`/reports/stock-movements?${e.toString()}`),i=Array.isArray(n.data)?n.data:Array.isArray(n)?n:[];if(i.length===0){a.innerHTML=y(`Belum Ada Pergerakan`,`Tidak ada riwayat mutasi stok yang sesuai pencarian.`);return}let o=i.map(e=>{let t=Se(e.date||e.transaction_date),n=e.quantity??0,r=m(e.unit_cost),i=m(e.total_cost),a=e.product?.name??`-`,o=e.project?.name??`-`;return`
          <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 text-slate-500 font-mono text-[11px]">${t}</td>
            <td class="px-5 py-3.5 font-medium text-slate-900">${a}</td>
            <td class="px-5 py-3.5">${_(e.type)}</td>
            <td class="px-5 py-3.5 text-right font-bold text-slate-900">${n}</td>
            <td class="px-5 py-3.5 text-right font-medium text-slate-700">${r}</td>
            <td class="px-5 py-3.5 text-right font-bold text-slate-900">${i}</td>
            <td class="px-5 py-3.5 text-slate-600 font-medium">${o}</td>
          </tr>`}).join(``),c=C(n);a.innerHTML=`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs text-left border-collapse">
              <thead class="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th class="px-5 py-3">Tanggal</th>
                  <th class="px-5 py-3">Produk</th>
                  <th class="px-5 py-3">Tipe Movement</th>
                  <th class="px-5 py-3 text-right">Kuantitas</th>
                  <th class="px-5 py-3 text-right">Unit Cost</th>
                  <th class="px-5 py-3 text-right">Total Cost</th>
                  <th class="px-5 py-3">Proyek</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 text-slate-700">${o}</tbody>
            </table>
          </div>
          ${c}
        </div>`,a.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,s())})})}catch(e){let t=e.status===401?`Tidak terautentikasi.`:`Gagal memuat pergerakan.`;a.innerHTML=`<div class="p-6 text-center text-xs text-rose-600">${t}</div>`}}},c=S(e=>{t.search=e,t.page=1,s()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>c(e.target.value.trim())),e.querySelector(`#typeSelect`).addEventListener(`change`,e=>{t.type=e.target.value,t.page=1,s()}),e.querySelector(`#projectSelect`).addEventListener(`change`,e=>{t.project_id=e.target.value,t.page=1,s()}),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,s()}),e.querySelector(`#dateFromInput`).addEventListener(`change`,e=>{t.date_from=e.target.value,t.page=1,s()}),e.querySelector(`#dateToInput`).addEventListener(`change`,e=>{t.date_to=e.target.value,t.page=1,s()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.type=``,t.project_id=``,t.date_from=``,t.date_to=``,t.sort=`transaction_date`,t.direction=`desc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#typeSelect`).value=``,e.querySelector(`#projectSelect`).value=``,e.querySelector(`#sortSelect`).value=`transaction_date-desc`,e.querySelector(`#dateFromInput`).value=``,e.querySelector(`#dateToInput`).value=``,s()}),s()}async function Ce(){try{let e=await r.get(`/inventory/stocks?per_page=100`);return(Array.isArray(e?.data)?e.data:Array.isArray(e)?e:[]).map(e=>e.product).filter(e=>e&&e.id)}catch{return[]}}async function we(){if(JSON.parse(localStorage.getItem(`auth_user`)||`{}`).role===`warehouse`)return[];try{let e=await r.get(`/projects`);return(Array.isArray(e?.data)?e.data:Array.isArray(e)?e:[]).filter(e=>e&&e.id)}catch{return[]}}function Te(e,t=`Memuat form...`){e&&(e.innerHTML=`<div class="flex items-center justify-center p-6"><p class="text-gray-600">${t}</p></div>`)}function Ee(e,t,n){if(!e)return;e.innerHTML=`
    <div class="p-4">
      <p class="text-danger mb-4">${t}</p>
      <button id="retryBtnForms" class="bg-primary text-white px-3 py-1 rounded hover:opacity-90">Coba Lagi</button>
    </div>`;let r=e.querySelector(`#retryBtnForms`);r&&n&&r.addEventListener(`click`,n)}function U(e,t=``){return!Array.isArray(e)||e.length===0?`<select name="product_id" class="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 w-full mb-3" disabled><option value="">(Tidak ada produk)</option></select>`:`<select name="product_id" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required>${e.map(e=>`<option value="${e.id}" ${e.id==t?`selected`:``}>${e.code?`${e.code} - ${e.name}`:e.name??e.id}</option>`).join(``)}</select>`}function De(e,t=``){return!Array.isArray(e)||e.length===0?`<select name="project_id" class="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 w-full mb-3"><option value="">-- Tanpa Project --</option></select>`:`<select name="project_id" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"><option value="">-- Pilih Project --</option>${e.map(e=>`<option value="${e.id}" ${e.id==t?`selected`:``}>${e.name??e.id}</option>`).join(``)}</select>`}function W(e,t,n,r){e.innerHTML=`<h4 class="font-heading text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200/80 flex items-center justify-between"><span>${t}</span></h4>${`
    <form class="space-y-1">
      ${n}
      <button type="submit" class="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-sm transition-all w-full mt-3 flex items-center justify-center gap-2">
        <span>Simpan Transaksi</span>
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
      </button>
    </form>`}`;let i=e.querySelector(`form`);i.addEventListener(`submit`,async e=>{e.preventDefault();let t={};new FormData(i).forEach((e,n)=>{t[n]=e}),await r(t)})}async function G(){let e=document.getElementById(`inventoryOverview`),t=document.getElementById(`inventoryMovements`);e&&V(e),t&&H(t)}async function Oe(e){try{await r.post(`/inventory/purchase-in`,e),alert(`Purchase In berhasil disimpan`),await G()}catch(e){e.status===422&&e.payload?.data?alert(`Validasi gagal: `+JSON.stringify(e.payload.data)):alert(`Error: `+(e.payload?.message??e.message))}}async function ke(e){try{await r.post(`/inventory/project-usage`,e),alert(`Project Usage berhasil disimpan`),await G()}catch(e){e.status===422&&e.payload?.data?alert(`Validasi gagal: `+JSON.stringify(e.payload.data)):alert(`Error: `+(e.payload?.message??e.message))}}async function Ae(e){try{await r.post(`/inventory/stock-out`,e),alert(`Stock Out berhasil disimpan`),await G()}catch(e){e.status===422&&e.payload?.data?alert(`Validasi gagal: `+JSON.stringify(e.payload.data)):alert(`Error: `+(e.payload?.message??e.message))}}async function je(e){try{await r.post(`/inventory/adjustment-in`,e),alert(`Adjustment In berhasil disimpan`),await G()}catch(e){e.status===422&&e.payload?.data?alert(`Validasi gagal: `+JSON.stringify(e.payload.data)):alert(`Error: `+(e.payload?.message??e.message))}}async function Me(e){try{await r.post(`/inventory/adjustment-out`,e),alert(`Adjustment Out berhasil disimpan`),await G()}catch(e){e.status===422&&e.payload?.data?alert(`Validasi gagal: `+JSON.stringify(e.payload.data)):alert(`Error: `+(e.payload?.message??e.message))}}async function Ne(e){if(!e)return;Te(e);let t=async()=>{try{let[t,n]=await Promise.all([Ce(),we()]),r=document.createElement(`div`);r.className=`p-5`;let i=document.createElement(`div`);i.className=`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`;let a=document.createElement(`div`);a.className=`bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card`,W(a,`Purchase In`,`
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${U(t)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Harga Satuan (Unit Cost)</label>
        <input type="number" step="0.01" name="unit_cost" min="0" placeholder="Unit Cost" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`,Oe),i.appendChild(a);let o=document.createElement(`div`);o.className=`bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card`,W(o,`Project Usage`,`
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${U(t)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Project</label>
        ${De(n)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`,ke),i.appendChild(o);let s=document.createElement(`div`);s.className=`bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card`,W(s,`Stock Out`,`
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${U(t)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`,Ae),i.appendChild(s);let c=document.createElement(`div`);c.className=`bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card`,W(c,`Adjustment In (+)`,`
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${U(t)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Harga Satuan (Unit Cost)</label>
        <input type="number" step="0.01" name="unit_cost" min="0" placeholder="Unit Cost" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`,je),i.appendChild(c);let l=document.createElement(`div`);l.className=`bg-slate-50/70 border border-slate-200/80 p-5 rounded-2xl shadow-card`,W(l,`Adjustment Out (-)`,`
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Produk</label>
        ${U(t)}
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Quantity</label>
        <input type="number" name="quantity" min="1" placeholder="Quantity" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Tanggal Transaksi</label>
        <input type="date" name="transaction_date" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3" required />
        <label class="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">Catatan</label>
        <textarea name="notes" placeholder="Catatan (optional)" class="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none w-full mb-3"></textarea>`,Me),i.appendChild(l),r.innerHTML=`
        <div class="mb-4">
          <h3 class="font-heading text-sm font-semibold text-slate-800">Form Transaksi Inventory</h3>
          <p class="text-xs text-slate-500">Pencatatan barang masuk, penggunaan project, barang keluar, & penyesuaian stok</p>
        </div>`,r.appendChild(i),e.innerHTML=``,e.appendChild(r)}catch(n){Ee(e,n.status===401?`Tidak terautentikasi.`:`Gagal memuat data untuk form.`,t)}};t()}async function Pe(e){if(!e)return;e.innerHTML=g(`Inventory Management`,`Pantau stok aktual persediaan, riwayat mutasi pergerakan barang, dan catat transaksi stok.`)+`
    <div class="space-y-8">
      <div id="inventoryOverview" class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"></div>
      <div id="inventoryMovements" class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"></div>
      <div id="inventoryForms" class="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden"></div>
    </div>`;let t=e.querySelector(`#inventoryOverview`),n=e.querySelector(`#inventoryMovements`),r=e.querySelector(`#inventoryForms`);t&&V(t),n&&H(n),r&&Ne(r)}async function Fe(e){if(!e)return;e.innerHTML=g(`Purchasing & Purchases`,`Kelola transaksi pembelian, pesanan barang dari supplier, dan histori penerimaan stok.`)+`
    <div class="mb-6 inline-flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner">
      <button data-tab="list" class="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80">
        Daftar Purchase
      </button>
      <button data-tab="new" class="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60">
        + Buat Purchase Baru
      </button>
    </div><div id="purchasingContent"></div>`;let t=e.querySelector(`#purchasingContent`);e.querySelectorAll(`button[data-tab]`).forEach(n=>{n.addEventListener(`click`,async()=>{e.querySelectorAll(`button[data-tab]`).forEach(e=>{e.className=`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60`}),n.className=`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80`;let r=n.getAttribute(`data-tab`);r===`list`?await K(t):r===`new`&&await J(t)})}),await K(t)}async function K(e){let t={search:``,supplier_id:``,status:``,date_from:``,date_to:``,sort:`created_at`,direction:`desc`,page:1},n=[];try{let e=await r.get(`/suppliers?per_page=100`);n=Array.isArray(e.data)?e.data:Array.isArray(e)?e:[]}catch{}let i=n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``);e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari PO / Supplier..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>

          <select id="supplierSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Supplier</option>
            ${i}
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
            <input type="date" id="dateFromInput" value="${t.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${t.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
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
    </div>`;let a=e.querySelector(`#purchasesTableContainer`),o=e.querySelector(`#dateValidationError`),s=async()=>{if(t.date_from&&t.date_to&&t.date_from>t.date_to)o.classList.remove(`hidden`);else{o.classList.add(`hidden`),a.innerHTML=v(`Memuat data purchase...`);try{let n=new URLSearchParams;t.search&&n.append(`search`,t.search),t.supplier_id&&n.append(`supplier_id`,t.supplier_id),t.status&&n.append(`status`,t.status),t.date_from&&n.append(`date_from`,t.date_from),t.date_to&&n.append(`date_to`,t.date_to),t.sort&&n.append(`sort`,t.sort),t.direction&&n.append(`direction`,t.direction),n.append(`page`,t.page),n.append(`per_page`,15);let i=await r.get(`/purchases?${n.toString()}`),o=Array.isArray(i?.data)?i.data:Array.isArray(i)?i:[];if(!o||o.length===0){a.innerHTML=y(`Belum Ada Purchase`,`Tidak ada transaksi pembelian yang sesuai kriteria pencarian.`);return}let c=o.map(e=>{let t=`neutral`;e.status===`CONFIRMED`?t=`success`:e.status===`DRAFT`?t=`warning`:e.status===`CANCELLED`&&(t=`danger`);let n=[];return n.push(`<button data-action="detail" data-id="${e.id}" class="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 hover:underline">Detail</button>`),e.status===`DRAFT`&&(n.push(`<button data-action="confirm" data-id="${e.id}" class="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-800 hover:underline ml-3">Konfirmasi</button>`),n.push(`<button data-action="cancel" data-id="${e.id}" class="inline-flex items-center gap-1 font-semibold text-rose-600 hover:text-rose-800 hover:underline ml-3">Batal</button>`)),`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">${e.purchase_number}</td>
            <td class="px-5 py-3.5 text-sm font-medium text-slate-800">${e.supplier?.name||`-`}</td>
            <td class="px-5 py-3.5 text-sm text-slate-500">${e.purchase_date}</td>
            <td class="px-5 py-3.5 text-sm">${_(e.status,t)}</td>
            <td class="px-5 py-3.5 text-sm font-mono font-medium text-slate-900 text-right">${m(e.total_amount)}</td>
            <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">${n.join(``)}</td>
          </tr>`}).join(``),l=C(i);a.innerHTML=`
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
              <tbody class="divide-y divide-slate-100">${c}</tbody>
            </table>
          </div>
          ${l}
        </div>`,a.querySelectorAll(`button[data-action]`).forEach(t=>{t.addEventListener(`click`,async()=>{let n=t.getAttribute(`data-action`),r=t.getAttribute(`data-id`);n===`detail`?await q(e,r):n===`confirm`?await Ie(e,r):n===`cancel`&&await Le(e,r)})}),a.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,s())})})}catch(e){a.innerHTML=b(`Gagal memuat daftar purchase (status ${e.status||500})`,()=>s())}}},c=S(e=>{t.search=e,t.page=1,s()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>c(e.target.value.trim())),e.querySelector(`#supplierSelect`).addEventListener(`change`,e=>{t.supplier_id=e.target.value,t.page=1,s()}),e.querySelector(`#statusSelect`).addEventListener(`change`,e=>{t.status=e.target.value,t.page=1,s()}),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,s()}),e.querySelector(`#dateFromInput`).addEventListener(`change`,e=>{t.date_from=e.target.value,t.page=1,s()}),e.querySelector(`#dateToInput`).addEventListener(`change`,e=>{t.date_to=e.target.value,t.page=1,s()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.supplier_id=``,t.status=``,t.date_from=``,t.date_to=``,t.sort=`created_at`,t.direction=`desc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#supplierSelect`).value=``,e.querySelector(`#statusSelect`).value=``,e.querySelector(`#sortSelect`).value=`created_at-desc`,e.querySelector(`#dateFromInput`).value=``,e.querySelector(`#dateToInput`).value=``,s()}),await s()}async function q(e,t){e.innerHTML=v(`Memuat detail purchase...`);try{let n=await r.get(`/purchases/${t}`),i=`neutral`;n.status===`CONFIRMED`?i=`success`:n.status===`DRAFT`?i=`warning`:n.status===`CANCELLED`&&(i=`danger`);let a=(n.items||[]).map(e=>`
      <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
        <td class="px-5 py-3 text-sm font-medium text-slate-800">
          ${e.product?.name||`-`}
          <span class="text-xs font-mono text-slate-400 block">${e.product?.code||``}</span>
        </td>
        <td class="px-5 py-3 text-sm font-mono text-right text-slate-700">${e.quantity}</td>
        <td class="px-5 py-3 text-sm font-mono text-right text-slate-700">${m(e.unit_cost)}</td>
        <td class="px-5 py-3 text-sm font-mono text-right font-medium text-slate-900">${m(e.subtotal)}</td>
      </tr>`).join(``);e.innerHTML=`
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
                <h3 class="text-xl font-bold text-slate-900 font-poppins">Purchase #${n.purchase_number}</h3>
                ${_(n.status,i)}
              </div>
              <p class="text-sm text-slate-500 mt-1">Tanggal Transaksi: <span class="font-medium text-slate-700">${n.purchase_date}</span></p>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 uppercase tracking-wider block font-medium">Total Nominal</span>
              <span class="text-2xl font-bold text-blue-600 font-mono">${m(n.total_amount)}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/80 rounded-xl p-4 border border-slate-100">
            <div>
              <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">Informasi Supplier</span>
              <p class="text-base font-semibold text-slate-800">${n.supplier?.name||`-`}</p>
            </div>
            <div>
              <span class="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-1">Catatan Transaksi</span>
              <p class="text-sm text-slate-600">${n.notes||`<em>Tidak ada catatan</em>`}</p>
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
                <tbody class="divide-y divide-slate-100">${a}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>`,document.getElementById(`backToList`).addEventListener(`click`,()=>K(e))}catch(n){e.innerHTML=b(`Gagal memuat detail purchase (status ${n.status||500})`,()=>q(e,t))}}async function Ie(e,t){e.innerHTML=v(`Mengonfirmasi purchase & memperbarui stok...`);try{await r.post(`/purchases/${t}/confirm`),await K(e)}catch(t){e.innerHTML=b(`Gagal melakukan konfirmasi purchase (status ${t.status||500})`,()=>K(e))}}async function Le(e,t){e.innerHTML=v(`Membatalkan purchase...`);try{await r.post(`/purchases/${t}/cancel`),await K(e)}catch(t){e.innerHTML=b(`Gagal membatalkan purchase (status ${t.status||500})`,()=>K(e))}}async function J(e){e.innerHTML=v(`Memuat data supplier & produk...`);try{let[t,n]=await Promise.all([r.get(`/suppliers`),r.get(`/products`)]),i=t.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``),a=n.map(e=>`<option value="${e.id}">${e.name} (${e.code})</option>`).join(``);e.innerHTML=`
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
                  ${i}
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
                      ${a}
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
      </div>`;let o=()=>K(e);document.getElementById(`backToList`).addEventListener(`click`,o),document.getElementById(`cancelFormBtn`).addEventListener(`click`,o);let s=document.getElementById(`itemsContainer`);s.querySelectorAll(`.remove-item`).forEach(e=>{e.addEventListener(`click`,e=>{s.querySelectorAll(`.item-row`).length>1?e.currentTarget.closest(`.item-row`).remove():alert(`Minimal satu item harus diisi.`)})}),document.getElementById(`addItemBtn`).addEventListener(`click`,()=>{let e=document.createElement(`div`);e.className=`flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 item-row`,e.innerHTML=`
        <div class="w-full sm:w-1/2">
          <select class="item-product w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required>
            <option value="">-- Pilih Produk --</option>
            ${a}
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
        </button>`,s.appendChild(e),e.querySelector(`.remove-item`).addEventListener(`click`,()=>{s.querySelectorAll(`.item-row`).length>1?e.remove():alert(`Minimal satu item harus diisi.`)})});let c=document.getElementById(`purchaseForm`);c.addEventListener(`submit`,async t=>{t.preventDefault();let n=new FormData(c),i=n.get(`supplier_id`),a=n.get(`purchase_date`),o=n.get(`notes`),l=[];if(s.querySelectorAll(`.item-row`).forEach(e=>{let t=e.querySelector(`.item-product`).value,n=parseFloat(e.querySelector(`.item-qty`).value),r=parseFloat(e.querySelector(`.item-unit`).value);t&&!isNaN(n)&&!isNaN(r)&&l.push({product_id:t,quantity:n,unit_cost:r})}),l.length===0)alert(`Harap tambahkan setidaknya satu item yang valid.`);else try{await r.post(`/purchases`,{supplier_id:i,purchase_date:a,notes:o,items:l}),await K(e)}catch(t){e.innerHTML=b(`Gagal menyimpan purchase (status ${t.status||500})`,()=>J(e))}})}catch(t){e.innerHTML=b(`Gagal memuat form purchase (status ${t.status||500})`,()=>J(e))}}var Re=[{id:`inventory`,label:`Ringkasan Persediaan`,endpoint:`/reports/inventory-summary`,roles:[`owner`,`warehouse`],render:Be},{id:`stockMovements`,label:`Pergerakan Stok`,endpoint:`/reports/stock-movements`,roles:[`owner`,`finance`,`warehouse`],render:Ve},{id:`purchase`,label:`Ringkasan Pembelian`,endpoint:`/reports/purchase-summary`,roles:[`owner`,`finance`],render:He},{id:`projectProfit`,label:`Profitabilitas Proyek`,endpoint:`/reports/project-profitability`,roles:[`owner`,`finance`],render:Ue},{id:`financial`,label:`Financial Overview`,endpoint:`/reports/financial-overview`,roles:[`owner`,`finance`],render:We},{id:`projectCost`,label:`Detail Biaya Proyek`,endpoint:`/reports/projects`,roles:[`owner`,`finance`],render:Ge}];async function ze(e,t=`/reports`){if(!e)return;let n=JSON.parse(localStorage.getItem(`auth_user`)||`{}`).role||``,r=Re.filter(e=>e.roles.includes(n));if(r.length===0){e.innerHTML=x(`Modul Laporan`,`Peran Anda tidak memiliki izin untuk melihat laporan ini.`);return}e.innerHTML=g(`Modul Laporan & Financial Reporting`,`Pantau analisis persediaan, mutasi pergerakan stok barang, histori pembelian supplier, serta analisis profitabilitas proyek.`)+`
    <div class="mb-6 flex overflow-x-auto p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner no-scrollbar gap-1 max-w-full">
      ${r.map((e,t)=>`
        <button data-report="${e.id}" class="px-4 py-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 ${t===0?`bg-white text-blue-600 font-semibold shadow-sm border border-slate-200/80`:`text-slate-600 hover:text-slate-900 hover:bg-white/60`}">
          ${e.label}
        </button>
      `).join(``)}
    </div><div id="reportContent"></div>`;let i=e.querySelector(`#reportContent`);e.querySelectorAll(`button[data-report]`).forEach(t=>{t.addEventListener(`click`,async()=>{e.querySelectorAll(`button[data-report]`).forEach(e=>{e.className=`px-4 py-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60`}),t.className=`px-4 py-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80`;let n=t.getAttribute(`data-report`),r=Re.find(e=>e.id===n);r&&await r.render(i)})});let a=e.querySelector(`button[data-report]`);a&&a.click()}async function Be(e){e.innerHTML=v(`Memuat ringkasan persediaan...`);async function t(){try{let t=await r.get(`/reports/inventory-summary`),{total_products:n,total_quantity:i,total_value:a,zero_stock:o,low_stock:s}=t.data??t;if([n,i,a,o,s].every(e=>e==null)){e.innerHTML=y(`Tidak Ada Data`,`Ringkasan persediaan kosong.`);return}e.innerHTML=`
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Produk</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${n??0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Item terdaftar</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Kuantitas</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${i??0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Total unit stok</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Nilai Persediaan</span>
              <span class="text-2xl font-bold text-blue-600 font-mono block mt-1">${m(a)}</span>
              <span class="text-xs text-slate-500 mt-1 block">Moving average value</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Stok Habis (Zero)</span>
              <span class="text-2xl font-bold text-rose-600 font-mono block mt-1">${o??0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Produk 0 unit</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Stok Menipis</span>
              <span class="text-2xl font-bold text-amber-600 font-mono block mt-1">${s??0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Di bawah minimum</span>
            </div>
          </div>
        </div>`}catch(n){e.innerHTML=b(n.status===401?`Tidak terautentikasi.`:`Gagal memuat Ringkasan Inventaris.`,t)}}await t()}async function Ve(e){let t={search:``,type:``,project_id:``,date_from:``,date_to:``,sort:`transaction_date`,direction:`desc`,page:1},n=[];try{let e=await r.get(`/projects?per_page=100`);n=Array.isArray(e.data)?e.data:Array.isArray(e)?e:[]}catch{}let i=n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``);e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari produk / kode..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
          </div>

          <select id="typeSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Tipe Movement</option>
            <option value="PURCHASE_IN">PURCHASE_IN</option>
            <option value="PROJECT_USAGE">PROJECT_USAGE</option>
            <option value="STOCK_OUT">STOCK_OUT</option>
            <option value="ADJUSTMENT_IN">ADJUSTMENT_IN</option>
            <option value="ADJUSTMENT_OUT">ADJUSTMENT_OUT</option>
          </select>

          <select id="projectSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Proyek</option>
            ${i}
          </select>

          <select id="sortSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="transaction_date-desc">Urut: Tanggal (Terbaru)</option>
            <option value="transaction_date-asc">Urut: Tanggal (Terlama)</option>
            <option value="quantity-desc">Urut: Qty (Terbanyak)</option>
            <option value="total_cost-desc">Urut: Total Cost (Tertinggi)</option>
          </select>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">Periode:</label>
            <input type="date" id="dateFromInput" value="${t.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${t.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
          </div>

          <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Reset Filter
          </button>
        </div>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="reportMovementsTableContainer"></div>
    </div>`;let a=e.querySelector(`#reportMovementsTableContainer`),o=e.querySelector(`#dateValidationError`),s=async()=>{if(t.date_from&&t.date_to&&t.date_from>t.date_to)o.classList.remove(`hidden`);else{o.classList.add(`hidden`),a.innerHTML=v(`Memuat pergerakan stok...`);try{let n=new URLSearchParams;t.search&&n.append(`search`,t.search),t.type&&n.append(`type`,t.type),t.project_id&&n.append(`project_id`,t.project_id),t.date_from&&n.append(`date_from`,t.date_from),t.date_to&&n.append(`date_to`,t.date_to),t.sort&&n.append(`sort`,t.sort),t.direction&&n.append(`direction`,t.direction),n.append(`page`,t.page),n.append(`per_page`,15);let i=await r.get(`/reports/stock-movements?${n.toString()}`),o=Array.isArray(i.data)?i.data:Array.isArray(i)?i:[];if(o.length===0){e.querySelector(`#reportMovementsTableContainer`).innerHTML=y(`Tidak Ada Data`,`Tidak ada pergerakan stok yang sesuai kriteria pencarian.`);return}let c=o.map(e=>{let t=`info`;return e.type===`PURCHASE_IN`?t=`success`:e.type===`PROJECT_USAGE`?t=`warning`:e.type===`STOCK_OUT`&&(t=`danger`),`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3 font-mono text-xs font-semibold text-slate-500">#${e.id??`-`}</td>
            <td class="px-5 py-3 text-sm text-slate-600">${e.date??`-`}</td>
            <td class="px-5 py-3 text-sm font-medium text-slate-800">${e.product?.name??`-`}</td>
            <td class="px-5 py-3 text-sm">${_(e.type??`MOV`,t)}</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${e.quantity??`-`}</td>
            <td class="px-5 py-3 text-sm font-mono text-right text-slate-600">${m(e.unit_cost)}</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${m(e.total_cost)}</td>
            <td class="px-5 py-3 text-sm text-slate-600">${e.project?.name??`-`}</td>
            <td class="px-5 py-3 text-sm text-slate-600">${e.created_by?.name??`-`}</td>
          </tr>`}).join(``),l=C(i);a.innerHTML=`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th class="px-5 py-3">ID</th>
                  <th class="px-5 py-3">Tanggal</th>
                  <th class="px-5 py-3">Produk</th>
                  <th class="px-5 py-3">Tipe Movement</th>
                  <th class="px-5 py-3 text-right">Qty</th>
                  <th class="px-5 py-3 text-right">Unit Cost</th>
                  <th class="px-5 py-3 text-right">Total Cost</th>
                  <th class="px-5 py-3">Proyek</th>
                  <th class="px-5 py-3">User</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${c}</tbody>
            </table>
          </div>
          ${l}
        </div>`,a.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,s())})})}catch{a.innerHTML=b(`Gagal memuat Pergerakan Stok.`,()=>s())}}},c=S(e=>{t.search=e,t.page=1,s()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>c(e.target.value.trim())),e.querySelector(`#typeSelect`).addEventListener(`change`,e=>{t.type=e.target.value,t.page=1,s()}),e.querySelector(`#projectSelect`).addEventListener(`change`,e=>{t.project_id=e.target.value,t.page=1,s()}),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,s()}),e.querySelector(`#dateFromInput`).addEventListener(`change`,e=>{t.date_from=e.target.value,t.page=1,s()}),e.querySelector(`#dateToInput`).addEventListener(`change`,e=>{t.date_to=e.target.value,t.page=1,s()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.type=``,t.project_id=``,t.date_from=``,t.date_to=``,t.sort=`transaction_date`,t.direction=`desc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#typeSelect`).value=``,e.querySelector(`#projectSelect`).value=``,e.querySelector(`#sortSelect`).value=`transaction_date-desc`,e.querySelector(`#dateFromInput`).value=``,e.querySelector(`#dateToInput`).value=``,s()}),await s()}async function He(e){let t={supplier_id:``,status:``,date_from:``,date_to:``},n=[];try{let e=await r.get(`/suppliers?per_page=100`);n=Array.isArray(e.data)?e.data:Array.isArray(e)?e:[]}catch{}e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex-1 flex flex-wrap items-center gap-3">
          <select id="supplierSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Supplier</option>
            ${n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}
          </select>
          <select id="statusSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500">Periode:</label>
            <input type="date" id="dateFromInput" value="${t.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${t.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
          </div>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="purchaseSummaryContent"></div>
    </div>`;let i=e.querySelector(`#purchaseSummaryContent`),a=e.querySelector(`#dateValidationError`),o=async()=>{if(t.date_from&&t.date_to&&t.date_from>t.date_to)a.classList.remove(`hidden`);else{a.classList.add(`hidden`),i.innerHTML=v(`Memuat ringkasan pembelian...`);try{let e=new URLSearchParams;t.supplier_id&&e.append(`supplier_id`,t.supplier_id),t.status&&e.append(`status`,t.status),t.date_from&&e.append(`date_from`,t.date_from),t.date_to&&e.append(`date_to`,t.date_to);let n=await r.get(`/reports/purchase-summary?${e.toString()}`),{total_purchases:a,total_amount:o,total_quantity:s,by_status:c,by_supplier:l}=n.data??n;if(a==null&&o==null){i.innerHTML=y(`Tidak Ada Data`,`Tidak ada data ringkasan purchase.`);return}let u=``;Array.isArray(c)&&c.length&&(u=c.map(e=>{let t=`neutral`;return e.status===`CONFIRMED`?t=`success`:e.status===`DRAFT`?t=`warning`:e.status===`CANCELLED`&&(t=`danger`),`
            <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
              <td class="px-5 py-3 text-sm">${_(e.status??`-`,t)}</td>
              <td class="px-5 py-3 text-sm font-mono text-slate-700">${e.count??0} transaksi</td>
              <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${m(e.amount)}</td>
            </tr>`}).join(``));let d=``;Array.isArray(l)&&l.length&&(d=l.map(e=>`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3 text-sm font-medium text-slate-800">${e.supplier_name??`-`}</td>
            <td class="px-5 py-3 text-sm font-mono text-slate-700">${e.count??0} transaksi</td>
            <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${m(e.amount)}</td>
          </tr>`).join(``)),i.innerHTML=`
        <div class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Purchases</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${a??0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Total pesanan pembelian</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Nominal Pembelian</span>
              <span class="text-2xl font-bold text-blue-600 font-mono block mt-1">${m(o)}</span>
              <span class="text-xs text-slate-500 mt-1 block">Nilai transaksi pembelian</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Kuantitas Barang</span>
              <span class="text-2xl font-bold text-slate-900 font-mono block mt-1">${s??0}</span>
              <span class="text-xs text-slate-500 mt-1 block">Unit barang dipesan</span>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${u?`
              <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Berdasarkan Status Transaksi</h4>
                <div class="rounded-xl border border-slate-200/80 overflow-hidden">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th class="px-5 py-3">Status</th>
                        <th class="px-5 py-3">Jumlah</th>
                        <th class="px-5 py-3 text-right">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">${u}</tbody>
                  </table>
                </div>
              </div>`:``}

            ${d?`
              <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
                <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider">Berdasarkan Supplier</h4>
                <div class="rounded-xl border border-slate-200/80 overflow-hidden">
                  <table class="w-full text-left border-collapse">
                    <thead>
                      <tr class="bg-slate-50 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        <th class="px-5 py-3">Nama Supplier</th>
                        <th class="px-5 py-3">Jumlah PO</th>
                        <th class="px-5 py-3 text-right">Total Nominal</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">${d}</tbody>
                  </table>
                </div>
              </div>`:``}
          </div>
        </div>`}catch{i.innerHTML=b(`Gagal memuat Ringkasan Pembelian.`,o)}}};e.querySelector(`#supplierSelect`).addEventListener(`change`,e=>{t.supplier_id=e.target.value,o()}),e.querySelector(`#statusSelect`).addEventListener(`change`,e=>{t.status=e.target.value,o()}),e.querySelector(`#dateFromInput`).addEventListener(`change`,e=>{t.date_from=e.target.value,o()}),e.querySelector(`#dateToInput`).addEventListener(`change`,e=>{t.date_to=e.target.value,o()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.supplier_id=``,t.status=``,t.date_from=``,t.date_to=``,e.querySelector(`#supplierSelect`).value=``,e.querySelector(`#statusSelect`).value=``,e.querySelector(`#dateFromInput`).value=``,e.querySelector(`#dateToInput`).value=``,o()}),await o()}async function Ue(e){let t={project_id:``,status:``,date_from:``,date_to:``},n=[];try{let e=await r.get(`/projects?per_page=100`);n=Array.isArray(e.data)?e.data:Array.isArray(e)?e:[]}catch{}e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="flex-1 flex flex-wrap items-center gap-3">
          <select id="projectSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Proyek</option>
            ${n.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}
          </select>
          <select id="statusSelect" class="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <option value="">Semua Status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500">Periode:</label>
            <input type="date" id="dateFromInput" value="${t.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${t.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50">
          </div>
        </div>
        <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          Reset Filter
        </button>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="profitabilityTableContainer"></div>
    </div>`;let i=e.querySelector(`#profitabilityTableContainer`),a=e.querySelector(`#dateValidationError`),o=async()=>{if(t.date_from&&t.date_to&&t.date_from>t.date_to)a.classList.remove(`hidden`);else{a.classList.add(`hidden`),i.innerHTML=v(`Memuat laporan profitabilitas proyek...`);try{let e=new URLSearchParams;t.project_id&&e.append(`project_id`,t.project_id),t.status&&e.append(`status`,t.status),t.date_from&&e.append(`date_from`,t.date_from),t.date_to&&e.append(`date_to`,t.date_to);let n=await r.get(`/reports/project-profitability?${e.toString()}`),a=n.data??n;if(!Array.isArray(a)||a.length===0){i.innerHTML=y(`Tidak Ada Data`,`Tidak ada data profitabilitas proyek yang sesuai kriteria.`);return}let o=a.map(e=>{let t=(e.gross_profit||0)>=0;return`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 text-sm font-semibold text-slate-900">${e.project_name??`-`}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-800 text-right">${m(e.revenue)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-600 text-right">${m(e.material_cost)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-600 text-right">${m(e.other_expenses)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-800 text-right font-medium">${m(e.total_cost)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-right font-bold ${t?`text-emerald-600`:`text-rose-600`}">${m(e.gross_profit)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-right font-bold ${t?`text-emerald-600`:`text-rose-600`}">${h(e.margin_percent)}</td>
          </tr>`}).join(``);i.innerHTML=`
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th class="px-5 py-3.5">Nama Proyek</th>
                  <th class="px-5 py-3.5 text-right">Revenue</th>
                  <th class="px-5 py-3.5 text-right">Material Cost</th>
                  <th class="px-5 py-3.5 text-right">Other Expenses</th>
                  <th class="px-5 py-3.5 text-right">Total Cost</th>
                  <th class="px-5 py-3.5 text-right">Gross Profit</th>
                  <th class="px-5 py-3.5 text-right">Margin (%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">${o}</tbody>
            </table>
          </div>
        </div>`}catch{i.innerHTML=b(`Gagal memuat Profitabilitas Proyek.`,o)}}};e.querySelector(`#projectSelect`).addEventListener(`change`,e=>{t.project_id=e.target.value,o()}),e.querySelector(`#statusSelect`).addEventListener(`change`,e=>{t.status=e.target.value,o()}),e.querySelector(`#dateFromInput`).addEventListener(`change`,e=>{t.date_from=e.target.value,o()}),e.querySelector(`#dateToInput`).addEventListener(`change`,e=>{t.date_to=e.target.value,o()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.project_id=``,t.status=``,t.date_from=``,t.date_to=``,e.querySelector(`#projectSelect`).value=``,e.querySelector(`#statusSelect`).value=``,e.querySelector(`#dateFromInput`).value=``,e.querySelector(`#dateToInput`).value=``,o()}),await o()}async function We(e){let t={date_from:``,date_to:``};e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2">
            <label class="text-xs text-slate-500 whitespace-nowrap">Periode Tanggal:</label>
            <input type="date" id="dateFromInput" value="${t.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${t.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
          </div>
          <button id="resetFilterBtn" class="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
            Reset Filter
          </button>
        </div>
      </div>

      <div id="dateValidationError" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
        Tanggal awal (Dari) tidak boleh setelah tanggal akhir (Sampai).
      </div>

      <div id="financialOverviewContent"></div>
    </div>`;let n=e.querySelector(`#financialOverviewContent`),i=e.querySelector(`#dateValidationError`),a=async()=>{if(t.date_from&&t.date_to&&t.date_from>t.date_to)i.classList.remove(`hidden`);else{i.classList.add(`hidden`),n.innerHTML=v(`Memuat financial overview...`);try{let e=new URLSearchParams;t.date_from&&e.append(`date_from`,t.date_from),t.date_to&&e.append(`date_to`,t.date_to);let i=await r.get(`/reports/financial-overview?${e.toString()}`),{total_purchase:a,total_project_revenue:o,total_material_cost:s,total_other_project_expenses:c,total_project_cost:l,gross_profit:u,margin_percent:d}=i.data??i;if(a==null&&o==null){n.innerHTML=y(`Tidak Ada Data`,`Tidak ada data overview keuangan.`);return}let f=(u||0)>=0;n.innerHTML=`
        <div class="space-y-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Purchases</span>
              <span class="text-2xl font-bold text-slate-900 font-mono">${m(a)}</span>
              <span class="text-xs text-slate-500 block mt-1">Pengeluaran pembelian stok</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Project Revenue</span>
              <span class="text-2xl font-bold text-blue-600 font-mono">${m(o)}</span>
              <span class="text-xs text-slate-500 block mt-1">Total nilai kontrak proyek</span>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Project Cost</span>
              <span class="text-2xl font-bold text-slate-900 font-mono">${m(l)}</span>
              <span class="text-xs text-slate-500 block mt-1">Material + Other Expenses</span>
            </div>

            <div class="${f?`bg-emerald-50/60 border-emerald-200/60`:`bg-rose-50/60 border-rose-200/60`} border rounded-2xl p-5 shadow-sm">
              <span class="text-xs font-semibold uppercase tracking-wider ${f?`text-emerald-700`:`text-rose-700`} block mb-1">Gross Profit & Margin</span>
              <span class="text-2xl font-bold ${f?`text-emerald-700`:`text-rose-700`} font-mono">${m(u)}</span>
              <span class="text-xs font-bold ${f?`text-emerald-600`:`text-rose-600`} block mt-1">Margin: ${h(d)}</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h4 class="text-base font-bold text-slate-900 font-poppins mb-4">Rincian Komponen Keuangan</h4>
            <div class="rounded-xl border border-slate-200/80 overflow-hidden">
              <table class="w-full text-left border-collapse">
                <tbody>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Purchase (Stok Masuk)</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${m(a)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Project Revenue</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-blue-600 text-right">${m(o)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Material Cost (Pemakaian Stok)</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${m(s)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                    <td class="px-5 py-3.5 text-sm font-medium text-slate-700">Total Other Project Expenses</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-semibold text-slate-900 text-right">${m(other_expenses??c)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors bg-slate-50">
                    <td class="px-5 py-3.5 text-sm font-bold text-slate-900">Total Project Cost</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-bold text-slate-900 text-right">${m(l)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${f?`bg-emerald-50/40`:`bg-rose-50/40`}">
                    <td class="px-5 py-3.5 text-sm font-bold ${f?`text-emerald-800`:`text-rose-800`}">Gross Profit</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-bold ${f?`text-emerald-700`:`text-rose-700`} text-right">${m(u)}</td>
                  </tr>
                  <tr class="hover:bg-slate-50/80 transition-colors ${f?`bg-emerald-50/40`:`bg-rose-50/40`}">
                    <td class="px-5 py-3.5 text-sm font-bold ${f?`text-emerald-800`:`text-rose-800`}">Margin (%)</td>
                    <td class="px-5 py-3.5 text-sm font-mono font-bold ${f?`text-emerald-700`:`text-rose-700`} text-right">${h(d)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>`}catch(e){let t=e.status===401?`Tidak terautentikasi.`:`Gagal memuat Overview Keuangan.`;n.innerHTML=b(t,a)}}};e.querySelector(`#dateFromInput`).addEventListener(`change`,e=>{t.date_from=e.target.value,a()}),e.querySelector(`#dateToInput`).addEventListener(`change`,e=>{t.date_to=e.target.value,a()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.date_from=``,t.date_to=``,e.querySelector(`#dateFromInput`).value=``,e.querySelector(`#dateToInput`).value=``,a()}),await a()}async function Ge(e){e.innerHTML=v(`Memuat daftar proyek...`);async function t(){try{let t=await r.get(`/projects`),i=t.data??t;if(!Array.isArray(i)||i.length===0){e.innerHTML=y(`Tidak Ada Proyek`,`Tidak ada proyek untuk ditampilkan.`);return}e.innerHTML=`
        <div class="space-y-6 max-w-3xl">
          <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Pilih Proyek Untuk Detail Biaya</label>
              <select id="projectSelect" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all">
                <option value="">-- Pilih Proyek --</option>
                ${i.map(e=>`<option value="${e.id}">${e.name}</option>`).join(``)}
              </select>
            </div>
            <div id="costDetailContainer"></div>
          </div>
        </div>`;let a=document.getElementById(`projectSelect`),o=document.getElementById(`costDetailContainer`);a.addEventListener(`change`,async()=>{let e=a.value;e?await n(o,e):o.innerHTML=``})}catch(n){e.innerHTML=b(n.status===401?`Tidak terautentikasi.`:`Gagal memuat daftar proyek.`,t)}}async function n(e,t){e.innerHTML=v(`Memuat detail biaya proyek...`);try{let n=await r.get(`/reports/projects/${t}/cost-detail`),{project_name:i,revenue:a,material_cost:o,other_expenses:s,total_cost:c,gross_profit:l,margin_percent:u}=n.data??n,d=(l||0)>=0;e.innerHTML=`
        <div class="pt-4 border-t border-slate-100 space-y-4">
          <h4 class="text-lg font-bold text-slate-900 font-poppins">${i}</h4>
          <div class="rounded-xl border border-slate-200/80 overflow-hidden">
            <table class="w-full text-left border-collapse">
              <tbody>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-sm font-medium text-slate-700">Revenue (Nilai Kontrak)</td>
                  <td class="px-5 py-3 text-sm font-mono font-semibold text-blue-600 text-right">${m(a)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-sm font-medium text-slate-700">Material Cost (Stok Barang)</td>
                  <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${m(o)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3 text-sm font-medium text-slate-700">Other Expenses (Non-Stok)</td>
                  <td class="px-5 py-3 text-sm font-mono font-semibold text-slate-900 text-right">${m(s)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors bg-slate-50">
                  <td class="px-5 py-3 text-sm font-bold text-slate-900">Total Cost</td>
                  <td class="px-5 py-3 text-sm font-mono font-bold text-slate-900 text-right">${m(c)}</td>
                </tr>
                <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${d?`bg-emerald-50/40`:`bg-rose-50/40`}">
                  <td class="px-5 py-3 text-sm font-bold ${d?`text-emerald-800`:`text-rose-800`}">Gross Profit</td>
                  <td class="px-5 py-3 text-sm font-mono font-bold ${d?`text-emerald-700`:`text-rose-700`} text-right">${m(l)}</td>
                </tr>
                <tr class="hover:bg-slate-50/80 transition-colors ${d?`bg-emerald-50/40`:`bg-rose-50/40`}">
                  <td class="px-5 py-3 text-sm font-bold ${d?`text-emerald-800`:`text-rose-800`}">Margin (%)</td>
                  <td class="px-5 py-3 text-sm font-mono font-bold ${d?`text-emerald-700`:`text-rose-700`} text-right">${h(u)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>`}catch(r){e.innerHTML=b(r.status===401?`Tidak terautentikasi.`:`Gagal memuat detail biaya proyek.`,()=>n(e,t))}}await t()}async function Ke(e,t=`/stock-opname`){if(!e)return;if(JSON.parse(localStorage.getItem(`auth_user`)||`{}`).role===`finance`){e.innerHTML=x(`Stock Opname`,`Modul ini khusus untuk peran Owner dan Warehouse. Peran Finance tidak memiliki akses.`);return}let n=g(`Stock Opname / Pencocokan Stok Fisik`,`Lakukan audit fisik persediaan barang, catat selisih antara stok sistem dan hasil hitung fisik, serta otomatiskan penyesuaian inventaris.`),r=t.split(`/`).filter(Boolean)[1];if(!r){e.innerHTML=n+`
      <div class="mb-6 inline-flex p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/60 shadow-inner">
        <button data-tab="list" class="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80">
          Daftar Opname
        </button>
        <button data-tab="create" class="px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60">
          + Buat Opname Baru
        </button>
      </div><div id="stockOpnameContent"></div>`;let t=e.querySelector(`#stockOpnameContent`);e.querySelectorAll(`button[data-tab]`).forEach(n=>{n.addEventListener(`click`,async()=>{e.querySelectorAll(`button[data-tab]`).forEach(e=>{e.className=`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 text-slate-600 hover:text-slate-900 hover:bg-white/60`}),n.className=`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white text-blue-600 shadow-sm border border-slate-200/80`;let r=n.getAttribute(`data-tab`);r===`list`?await Y(t):r===`create`&&await qe(t)})}),await Y(t);return}if(r===`create`){let t=document.createElement(`div`);e.innerHTML=n,e.appendChild(t),await qe(t);return}let i=r,a=document.createElement(`div`);e.innerHTML=n,e.appendChild(a),await X(a,i)}async function Y(e){let t={search:``,status:``,date_from:``,date_to:``,sort:`created_at`,direction:`desc`,page:1};e.innerHTML=`
    <div class="space-y-4">
      <div class="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div class="relative">
            <svg class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" id="searchInput" placeholder="Cari nomor opname / catatan..." value="${t.search}" class="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-slate-50/50">
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
            <input type="date" id="dateFromInput" value="${t.date_from}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
            <span class="text-xs text-slate-400">s/d</span>
            <input type="date" id="dateToInput" value="${t.date_to}" class="text-xs border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600">
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
    </div>`;let n=e.querySelector(`#stockOpnameTableContainer`),i=e.querySelector(`#dateValidationError`),a=async()=>{if(t.date_from&&t.date_to&&t.date_from>t.date_to)i.classList.remove(`hidden`);else{i.classList.add(`hidden`),n.innerHTML=v(`Memuat daftar Stock Opname...`);try{let i=new URLSearchParams;t.search&&i.append(`search`,t.search),t.status&&i.append(`status`,t.status),t.date_from&&i.append(`date_from`,t.date_from),t.date_to&&i.append(`date_to`,t.date_to),t.sort&&i.append(`sort`,t.sort),t.direction&&i.append(`direction`,t.direction),i.append(`page`,t.page),i.append(`per_page`,15);let o=await r.get(`/stock-opnames?${i.toString()}`),s=Array.isArray(o?.data)?o.data:Array.isArray(o)?o:[];if(!s||s.length===0){n.innerHTML=y(`Belum Ada Stock Opname`,`Tidak ada kegiatan pencocokan stok fisik yang sesuai pencarian.`);return}let c=s.map(e=>{let t=`neutral`;e.status===`COMPLETED`?t=`success`:e.status===`DRAFT`?t=`warning`:e.status===`CANCELLED`&&(t=`danger`);let n=[];return n.push(`<button data-action="view" data-id="${e.id}" class="font-semibold text-blue-600 hover:text-blue-800 hover:underline">Detail</button>`),e.status===`DRAFT`&&(n.push(`<button data-action="complete" data-id="${e.id}" class="font-semibold text-emerald-600 hover:text-emerald-800 hover:underline ml-3">Complete</button>`),n.push(`<button data-action="cancel" data-id="${e.id}" class="font-semibold text-rose-600 hover:text-rose-800 hover:underline ml-3">Batal</button>`)),`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-500">#${e.id}</td>
            <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">${e.opname_number??`-`}</td>
            <td class="px-5 py-3.5 text-sm text-slate-600">${e.opname_date??`-`}</td>
            <td class="px-5 py-3.5 text-sm">${_(e.status,t)}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-slate-700">${e.items?.length??0} item</td>
            <td class="px-5 py-3.5 text-sm text-slate-600">${e.created_by??`-`}</td>
            <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">${n.join(``)}</td>
          </tr>`}).join(``),l=C(o);n.innerHTML=`
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
              <tbody class="divide-y divide-slate-100">${c}</tbody>
            </table>
          </div>
          ${l}
        </div>`,n.querySelectorAll(`button[data-action]`).forEach(t=>{let n=t.getAttribute(`data-id`),r=t.getAttribute(`data-action`);t.addEventListener(`click`,async()=>{r===`view`?await X(e,n):r===`complete`?await Xe(e,n):r===`cancel`&&await Ze(e,n)})}),n.querySelectorAll(`.pagination-btn`).forEach(e=>{e.addEventListener(`click`,()=>{let n=parseInt(e.getAttribute(`data-page`));n&&n!==t.page&&(t.page=n,a())})})}catch{n.innerHTML=b(`Gagal memuat daftar Stock Opname.`,()=>a())}}},o=S(e=>{t.search=e,t.page=1,a()},300);e.querySelector(`#searchInput`).addEventListener(`input`,e=>o(e.target.value.trim())),e.querySelector(`#statusSelect`).addEventListener(`change`,e=>{t.status=e.target.value,t.page=1,a()}),e.querySelector(`#sortSelect`).addEventListener(`change`,e=>{let[n,r]=e.target.value.split(`-`);t.sort=n,t.direction=r,t.page=1,a()}),e.querySelector(`#dateFromInput`).addEventListener(`change`,e=>{t.date_from=e.target.value,t.page=1,a()}),e.querySelector(`#dateToInput`).addEventListener(`change`,e=>{t.date_to=e.target.value,t.page=1,a()}),e.querySelector(`#resetFilterBtn`).addEventListener(`click`,()=>{t.search=``,t.status=``,t.date_from=``,t.date_to=``,t.sort=`created_at`,t.direction=`desc`,t.page=1,e.querySelector(`#searchInput`).value=``,e.querySelector(`#statusSelect`).value=``,e.querySelector(`#sortSelect`).value=`created_at-desc`,e.querySelector(`#dateFromInput`).value=``,e.querySelector(`#dateToInput`).value=``,a()}),await a()}async function qe(e){e.innerHTML=v(`Memuat form Stock Opname...`);async function t(){try{e.innerHTML=`
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
                <input type="date" name="opname_date" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" value="${new Date().toISOString().split(`T`)[0]}" required />
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
        </div>`;let n=()=>Y(e);document.getElementById(`backBtn`).addEventListener(`click`,n),document.getElementById(`cancelFormBtn`).addEventListener(`click`,n);let i=document.getElementById(`opnameForm`);i.addEventListener(`submit`,async n=>{n.preventDefault();let a=Object.fromEntries(new FormData(i));try{let t=await r.post(`/stock-opnames`,a);await X(e,t.id??t.data?.id)}catch(n){e.innerHTML=b(n.status===422?`Validasi gagal.`:`Gagal membuat Stock Opname.`,t)}})}catch(n){e.innerHTML=b(n.status===401?`Tidak terautentikasi.`:`Gagal memuat form.`,t)}}await t()}async function X(e,t){e.innerHTML=v(`Memuat detail Stock Opname...`);async function n(){try{let[i,a]=await Promise.all([r.get(`/stock-opnames/${t}`),r.get(`/products`)]),o=i.data??i,s=a.data??a,c=`neutral`;o.status===`COMPLETED`?c=`success`:o.status===`DRAFT`?c=`warning`:o.status===`CANCELLED`&&(c=`danger`);let l=(o.items||[]).map(e=>{let t=o.status===`DRAFT`?`<button data-action="edit" data-item-id="${e.id}" class="text-blue-600 hover:underline font-semibold mr-3">Edit</button>`:``,n=o.status===`DRAFT`?`<button data-action="delete" data-item-id="${e.id}" class="text-rose-600 hover:underline font-semibold">Delete</button>`:``,r=Number(e.difference_quantity||0),i=`<span class="font-mono text-slate-500">0</span>`;return r>0?i=`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">+${r}</span>`:r<0&&(i=`<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200/80">${r}</span>`),`
          <tr class="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
            <td class="px-5 py-3.5 text-sm font-medium text-slate-800">
              ${e.product?.name??`-`}
              <span class="text-xs font-mono text-slate-400 block">${e.product?.code??``}</span>
            </td>
            <td class="px-5 py-3.5 text-sm font-mono text-right text-slate-700">${e.system_quantity}</td>
            <td class="px-5 py-3.5 text-sm font-mono text-right font-semibold text-slate-900">${e.physical_quantity}</td>
            <td class="px-5 py-3.5 text-sm text-right font-mono">${i}</td>
            <td class="px-5 py-3.5 text-sm text-right whitespace-nowrap">${t} ${n}</td>
          </tr>`}).join(``);if(e.innerHTML=`
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
                  <h3 class="text-xl font-bold text-slate-900 font-poppins">Opname #${o.opname_number||o.id}</h3>
                  ${_(o.status,c)}
                </div>
                <p class="text-sm text-slate-500 mt-1">Tanggal Pelaksanaan: <span class="font-medium text-slate-700">${o.opname_date??`-`}</span> • Pembuat: <span class="font-medium text-slate-700">${o.created_by??`-`}</span></p>
              </div>

              ${o.status===`DRAFT`?`
                <div class="flex items-center gap-2">
                  <button id="completeBtn" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm">
                    ✓ Complete & Proses Selisih
                  </button>
                  <button id="cancelBtn" class="px-4 py-2 bg-white border border-slate-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 text-xs font-semibold rounded-xl transition-all shadow-sm">
                    Batalkan
                  </button>
                </div>`:``}
            </div>

            <!-- Workflow Stepper -->
            <div class="grid grid-cols-3 gap-3 p-4 bg-slate-50/80 rounded-xl border border-slate-100 text-center text-xs">
              <div class="space-y-1">
                <span class="font-semibold text-slate-700">1. Draft Created</span>
                <p class="text-slate-400">Dokumen opname dibuat</p>
              </div>
              <div class="space-y-1">
                <span class="font-semibold ${o.items?.length>0?`text-blue-600`:`text-slate-500`}">2. Hitung Fisik (${o.items?.length||0} item)</span>
                <p class="text-slate-400">Input hasil fisik barang</p>
              </div>
              <div class="space-y-1">
                <span class="font-semibold ${o.status===`COMPLETED`?`text-emerald-600`:`text-slate-400`}">3. Complete Opname</span>
                <p class="text-slate-400">Otomatisasi adjustment stok</p>
              </div>
            </div>

            <!-- Items table -->
            <div>
              <h4 class="text-base font-semibold text-slate-900 font-poppins mb-3">Item Hasil Audit Fisik</h4>
              ${l?`
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
                    <tbody class="divide-y divide-slate-100">${l}</tbody>
                  </table>
                </div>`:`
                <div class="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p class="text-sm font-medium text-slate-600">Belum Ada Item Yang Ditambahkan</p>
                  <p class="text-xs text-slate-400 mt-1">Gunakan form di bawah untuk memasukkan hasil hitung fisik barang.</p>
                </div>`}
            </div>

            <!-- Add item form for DRAFT -->
            ${o.status===`DRAFT`?`
              <div class="border-t border-slate-100 pt-6">
                <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">+ Tambah Item Ke Hasil Audit</h4>
                <form id="addItemForm" class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-200/60">
                  <div>
                    <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Pilih Produk</label>
                    <select name="product_id" class="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20" required>
                      <option value="">-- Pilih Produk --</option>
                      ${s.map(e=>`<option value="${e.id}">${e.name} (${e.code})</option>`).join(``)}
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
              </div>`:``}
          </div>
        </div>`,document.getElementById(`backBtn`).addEventListener(`click`,()=>Y(e)),o.status===`DRAFT`){let i=document.getElementById(`addItemForm`);i&&i.addEventListener(`submit`,async a=>{a.preventDefault();let o=Object.fromEntries(new FormData(i));try{await r.post(`/stock-opnames/${t}/items`,o),await X(e,t)}catch(t){e.innerHTML=b(t.status===422?`Validasi item gagal.`:`Gagal menambah item.`,n)}}),e.querySelectorAll(`button[data-action]`).forEach(n=>{let r=n.getAttribute(`data-item-id`),i=n.getAttribute(`data-action`);n.addEventListener(`click`,async()=>{i===`edit`?await Je(e,t,r,s):i===`delete`&&await Ye(e,t,r)})}),document.getElementById(`completeBtn`)?.addEventListener(`click`,async()=>{if(confirm(`Selesaikan Stock Opname ini? Selisih quantity fisik akan otomatis dicatat sebagai transaksi adjustment persediaan stok.`))try{await r.post(`/stock-opnames/${t}/complete`),await X(e,t)}catch(t){e.innerHTML=b(t.payload?.message||`Gagal melakukan complete.`,n)}}),document.getElementById(`cancelBtn`)?.addEventListener(`click`,async()=>{if(confirm(`Apakah Anda yakin ingin membatalkan Stock Opname ini?`))try{await r.post(`/stock-opnames/${t}/cancel`),await X(e,t)}catch(t){e.innerHTML=b(t.payload?.message||`Gagal membatalkan.`,n)}})}}catch(t){e.innerHTML=b(t.status===401?`Tidak terautentikasi.`:`Gagal memuat detail Stock Opname.`,n)}}await n()}async function Je(e,t,n,i){e.innerHTML=v(`Memuat data edit item...`);async function a(){try{let i=await r.get(`/stock-opnames/${t}/items/${n}`),o=i.data??i;e.innerHTML=`
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
              <p class="font-medium text-slate-800">${o.product?.name??`-`} <span class="font-mono text-slate-400">(${o.product?.code??``})</span></p>
              <p class="text-xs text-slate-500 mt-1">Stok Tercatat di Sistem: <span class="font-mono font-semibold text-slate-700">${o.system_quantity}</span></p>
            </div>

            <form id="editItemForm" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Kuantitas Fisik (Physical Qty)</label>
                <input type="number" step="0.001" min="0" name="physical_quantity" value="${o.physical_quantity}" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20" required />
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Catatan Selisih (Opsional)</label>
                <textarea name="notes" rows="2" class="w-full bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 rounded-xl px-3.5 py-2.5 shadow-sm text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20">${o.notes??``}</textarea>
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
        </div>`;let s=()=>X(e,t);document.getElementById(`backDetailBtn`).addEventListener(`click`,s),document.getElementById(`cancelEditBtn`).addEventListener(`click`,s);let c=document.getElementById(`editItemForm`);c.addEventListener(`submit`,async i=>{i.preventDefault();let o=Object.fromEntries(new FormData(c));try{await r.put(`/stock-opnames/${t}/items/${n}`,o),await X(e,t)}catch(t){e.innerHTML=b(t.status===422?`Validasi gagal.`:`Gagal memperbarui item.`,a)}})}catch(t){e.innerHTML=b(t.status===401?`Tidak terautentikasi.`:`Gagal memuat data item.`,a)}}await a()}async function Ye(e,t,n){if(confirm(`Apakah Anda yakin ingin menghapus item ini dari daftar opname?`))try{await r.delete(`/stock-opnames/${t}/items/${n}`),await X(e,t)}catch(n){e.innerHTML=b(n.payload?.message||`Gagal menghapus item.`,()=>X(e,t))}}async function Xe(e,t){if(confirm(`Selesaikan Stock Opname ini? Selisih quantity fisik akan otomatis dicatat sebagai transaksi adjustment persediaan stok.`))try{await r.post(`/stock-opnames/${t}/complete`),await Y(e)}catch(t){e.innerHTML=b(t.payload?.message||`Gagal melakukan complete.`,()=>Y(e))}}async function Ze(e,t){if(confirm(`Apakah Anda yakin ingin membatalkan Stock Opname ini?`))try{await r.post(`/stock-opnames/${t}/cancel`),await Y(e)}catch(t){e.innerHTML=b(t.payload?.message||`Gagal membatalkan.`,()=>Y(e))}}function Z(e=`Memuat aplikasi...`){let t=document.getElementById(`app`);t.innerHTML=`<div class="flex items-center justify-center h-screen bg-background"><p class="text-xl">${e}</p></div>`}var Qe={owner:[`/dashboard`,`/master-data`,`/products`,`/categories`,`/suppliers`,`/inventory`,`/purchasing`,`/projects`,`/stock-opname`,`/reports`],warehouse:[`/dashboard`,`/products`,`/inventory`,`/stock-opname`],finance:[`/dashboard`,`/suppliers`,`/purchasing`,`/projects`,`/reports`]};function $e(e){let t=document.getElementById(`mainContent`);t&&(t.innerHTML=`
    <h2 class="text-2xl font-bold mb-4 capitalize">${e.replace(/^\//,``).replace(/-/g,` `)}</h2>
    <p class="text-gray-600">Halaman ini belum diimplementasikan.</p>
  `)}function et(){let e=document.getElementById(`mainContent`);if(!e)return;e.innerHTML=`
    <h2 class="text-2xl font-bold text-danger mb-4">404 / Akses Ditolak – Halaman tidak ditemukan</h2>
    <p class="mb-4">Halaman yang Anda minta tidak ada atau Anda tidak memiliki izin untuk mengaksesnya.</p>
    <button id="backBtn" class="bg-primary text-white px-4 py-2 rounded hover:bg-dark">Kembali ke Dashboard</button>
  `;let t=document.getElementById(`backBtn`);t&&t.addEventListener(`click`,()=>{window.location.hash=`#/dashboard`})}function tt(e){if(!e){p();return}let t=(window.location.hash||`#/dashboard`).replace(`#`,``).split(`?`)[0];if(!(Qe[e.role]||[]).includes(t)){et();return}let n=document.getElementById(`mainContent`);t===`/dashboard`?e.role===`owner`?D():e.role===`warehouse`?k():e.role===`finance`?M():$e(t):t===`/master-data`?B():t===`/products`?N(n):t===`/suppliers`?P(n):t===`/inventory`?Pe(n):t===`/purchasing`?Fe(n):t===`/projects`?I(n):t===`/stock-opname`?Ke(n):t===`/reports`?ze(n):$e(t)}var Q=null;async function $(){(window.location.hash||`#/dashboard`).replace(`#`,``).split(`?`)[0]===`/login`?(Q=null,p()):(Q=await f(),Q?(await ae(Q),tt(Q)):(window.location.hash=`#/login`,p()))}async function nt(){Z(),window.addEventListener(`hashchange`,$);try{await $()}catch(e){console.error(`Bootstrap error message:`,e.message,e.stack,e),e.status===401?(l(),Q=null,p()):e.status===403?Z(`Akses ditolak (403).`):e.status===404?Z(`Sumber daya tidak ditemukan (404).`):e.status===422?Z(`Data tidak valid (422).`):e.status>=500?Z(`Kesalahan server. Silakan coba lagi nanti.`):Z(`Terjadi kesalahan tak terduga.`)}}nt();