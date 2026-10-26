import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { IconButton } from './IconButton.jsx';

const SIZES = { md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };

// On mobile the modal opens as a bottom sheet; on sm and up it is centered.
export function Modal({ open, onClose, title, description, size = 'md', footer, children }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop transition className="fixed inset-0 bg-slate-900/50 transition-opacity duration-200 data-closed:opacity-0" />
      <div className="fixed inset-0 flex items-end justify-center sm:items-center sm:p-4">
        <DialogPanel
          transition
          className={cn(
            'flex max-h-[92vh] w-full flex-col rounded-t-modal bg-surface shadow-xl transition duration-200 sm:rounded-modal',
            'data-closed:translate-y-4 data-closed:opacity-0',
            SIZES[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <DialogTitle className="text-lg font-semibold text-ink">{title}</DialogTitle>
              {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
            </div>
            <IconButton icon={X} label="Tutup" onClick={onClose} className="-mr-2" />
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
          {footer ? (
            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3 sm:flex-row sm:justify-end">{footer}</div>
          ) : null}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
