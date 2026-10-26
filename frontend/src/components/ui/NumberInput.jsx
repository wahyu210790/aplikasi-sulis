import { cn } from '../../lib/cn.js';
import { INPUT_BASE, INPUT_HEIGHT, borderFor } from './inputStyles.js';

// Quantity input. Keeps the text the user types (Indonesian style, e.g. "12,5").
// value / onChange use that raw text. Convert with parseQty() from lib/format.js before sending to the API.
export function NumberInput({ value, onChange, invalid = false, suffix, className, ...rest }) {
  function handleChange(e) {
    const text = e.target.value;
    if (/^[0-9.,]*$/.test(text)) onChange(text);
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value ?? ''}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        className={cn(INPUT_BASE, INPUT_HEIGHT, borderFor(invalid), 'text-right tabular-nums', suffix && 'pr-12', className)}
        {...rest}
      />
      {suffix ? (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted">{suffix}</span>
      ) : null}
    </div>
  );
}
