import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';

// Shows the temporary password ONCE after a reset. It is never stored.
export function TemporaryPasswordModal({ open, onClose, userName, password }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function close() {
    setCopied(false);
    onClose();
  }

  return (
    <Modal open={open} onClose={close} title="Password sementara" footer={<Button onClick={close}>Selesai</Button>}>
      <p className="text-sm text-ink">
        Berikan password ini kepada <span className="font-medium">{userName}</span>. Minta dia menggantinya setelah masuk.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <code className="flex-1 rounded-control border border-line bg-canvas px-3 py-2.5 font-mono text-base tracking-wide text-ink select-all">{password}</code>
        <Button variant="secondary" leftIcon={copied ? Check : Copy} onClick={copy}>
          {copied ? 'Tersalin' : 'Salin'}
        </Button>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-control bg-warning-soft px-3 py-2.5 text-sm text-warning">
        <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
        Password ini hanya ditampilkan sekali.
      </p>
    </Modal>
  );
}
