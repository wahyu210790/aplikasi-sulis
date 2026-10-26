import { cn } from '../../lib/cn.js';
import { INPUT_BASE, INPUT_HEIGHT, borderFor } from './inputStyles.js';

function groupThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Money input in whole rupiah. value / onChange use a number (integer) or null when empty.
export function MoneyInput({ value, onChange, invalid = false, className, ...rest }) {
  const display = value === null || value === undefined ? '' : groupThousands(String(value));

  function handleChange(e) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
    onChange(digits === '' ? null : Number(digits));
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        className={cn(INPUT_BASE, INPUT_HEIGHT, borderFor(invalid), 'pl-10 text-right tabular-nums', className)}
        {...rest}
      />
    </div>
  );
}
