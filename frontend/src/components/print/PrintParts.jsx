import { formatDateTime } from '../../lib/format.js';

// Parts of a printed proof (docs/desain-v2.md T6.02). They are hidden on screen and only appear when printing
// (inside an element with class "print-area", see styles/index.css).

// Company name, document title and number. cancelled: shows "DIBATALKAN" next to the number.
export function PrintHeader({ title, number, cancelled = false }) {
  return (
    <div className="hidden border-b-2 border-ink pb-3 print:block">
      <p className="text-sm font-semibold">PT. Best Engineer Persada</p>
      <p className="mt-1 text-lg font-bold tracking-wide">{title}</p>
      <p className="font-mono text-sm">
        {number}
        {cancelled ? <span className="ml-3 font-sans font-bold">DIBATALKAN</span> : null}
      </p>
    </div>
  );
}

// Signature boxes. signatures: [{ label, name }] — name is printed under the line, or "(nama jelas)" when empty.
export function PrintSignatures({ signatures }) {
  return (
    <div className="print-keep hidden grid-cols-2 gap-8 pt-8 text-center text-sm print:grid">
      {signatures.map((sign) => (
        <div key={sign.label}>
          <p>{sign.label}</p>
          <div className="mt-16 border-t border-ink pt-1">{sign.name || '(nama jelas)'}</div>
        </div>
      ))}
    </div>
  );
}

// Small line at the bottom: who printed it and when.
export function PrintFooter({ user }) {
  return (
    <p className="hidden pt-6 text-xs text-muted print:block">
      Dicetak oleh {user?.name ?? '–'} pada {formatDateTime(new Date().toISOString())}
    </p>
  );
}
