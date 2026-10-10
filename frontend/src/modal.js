// src/modal.js
// Modern modal implementation using plain HTML and CSS classes.

export function openModal(contentHtml) {
  closeModal(); // Remove any existing modal
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-200';
  
  // Modal container
  const modal = document.createElement('div');
  modal.className = 'bg-white rounded-2xl shadow-elevated border border-slate-200/80 max-w-lg w-full p-6 overflow-hidden relative transform transition-all';
  modal.innerHTML = contentHtml;
  
  // Append to overlay
  overlay.appendChild(modal);
  // Append overlay to body
  document.body.appendChild(overlay);

  // Close on overlay click (outside modal)
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });
}

export function closeModal() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.remove();
}
