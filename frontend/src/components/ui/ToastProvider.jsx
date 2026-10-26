import { useCallback, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { ToastContext } from './ToastContext.js';

const TONES = {
  success: { icon: CircleCheck, className: 'text-success' },
  danger: { icon: CircleAlert, className: 'text-danger' },
  info: { icon: Info, className: 'text-info' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (tone, message) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, tone, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('danger', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((toast) => {
          const tone = TONES[toast.tone];
          const Icon = tone.icon;
          return (
            <div
              key={toast.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 text-sm text-ink shadow-lg"
            >
              <Icon aria-hidden="true" className={cn('mt-0.5 h-5 w-5 shrink-0', tone.className)} />
              <p className="flex-1">{toast.message}</p>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Tutup" className="text-muted hover:text-ink">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
