import { useState } from 'react';
import { Button } from './Button.jsx';
import { FormField } from './FormField.jsx';
import { Modal } from './Modal.jsx';
import { Textarea } from './Textarea.jsx';

// onConfirm(reason) — reason is '' unless requireReason is true (then at least 5 characters).
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  tone = 'primary',
  requireReason = false,
  reasonLabel = 'Alasan',
  loading = false,
}) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);
  const reasonValid = !requireReason || reason.trim().length >= 5;

  function close() {
    setReason('');
    setTouched(false);
    onClose();
  }

  function confirm() {
    setTouched(true);
    if (!reasonValid) return;
    onConfirm(requireReason ? reason.trim() : '');
  }

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : close}
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink">{message}</p>
      {requireReason ? (
        <FormField
          label={reasonLabel}
          htmlFor="confirm-reason"
          required
          className="mt-4"
          error={touched && !reasonValid ? 'Alasan minimal 5 karakter.' : undefined}
        >
          <Textarea id="confirm-reason" value={reason} onChange={(e) => setReason(e.target.value)} invalid={touched && !reasonValid} />
        </FormField>
      ) : null}
    </Modal>
  );
}
