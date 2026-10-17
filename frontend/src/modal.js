// src/modal.js
// Responsive mobile-first modal implementation

export function openModal(content) {
  closeModal(); // Remove any existing modal
  
  // Create overlay with backdrop blur
  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-50 transition-opacity duration-200';
  
  // Modal container with responsive max-height and scrolling
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-2xl shadow-elevated border border-slate-200/80 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden relative transform transition-all';
  
  // Handle both string and object { title, body } signatures
  let innerHtml = '';
  if (typeof content === 'string') {
    innerHtml = content;
  } else if (content && typeof content === 'object') {
    const titleHtml = content.title ? `
      <div class="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <h3 class="text-base font-bold text-slate-900">${content.title}</h3>
        <button type="button" id="modalCloseXBtn" class="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>` : '';
    innerHtml = `
      ${titleHtml}
      <div class="p-5 sm:px-6 overflow-y-auto flex-1">
        ${content.body || ''}
      </div>`;
  }

  // Inner wrapper
  modal.innerHTML = typeof content === 'string' 
    ? `<div class="p-5 sm:p-6 overflow-y-auto flex-1">${innerHtml}</div>` 
    : innerHtml;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Close on X button click if present
  modal.querySelector('#modalCloseXBtn')?.addEventListener('click', closeModal);

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

export function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
}
