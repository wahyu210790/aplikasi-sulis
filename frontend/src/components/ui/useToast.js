import { useContext } from 'react';
import { ToastContext } from './ToastContext.js';

// const toast = useToast(); toast.success('Tersimpan.'); toast.error('Gagal.'); toast.info('...');
export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside <ToastProvider>');
  return value;
}
