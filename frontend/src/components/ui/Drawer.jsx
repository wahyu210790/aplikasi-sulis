import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';

// Left slide-in panel (mobile menu). Dark sidebar colors.
export function Drawer({ open, onClose, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50 lg:hidden">
      <DialogBackdrop transition className="fixed inset-0 bg-slate-900/60 transition-opacity duration-200 data-closed:opacity-0" />
      <DialogPanel
        transition
        className="fixed inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-sidebar text-slate-300 shadow-xl transition duration-200 data-closed:-translate-x-full"
      >
        {children}
      </DialogPanel>
    </Dialog>
  );
}
