import { cn } from '../../lib/cn.js';
import { INPUT_BASE, INPUT_HEIGHT, borderFor } from './inputStyles.js';

// value / onChange use 'YYYY-MM-DD' strings ('' when empty).
export function DateInput({ value, onChange, invalid = false, className, ...rest }) {
  return (
    <input
      type="date"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={invalid || undefined}
      className={cn(INPUT_BASE, INPUT_HEIGHT, borderFor(invalid), className)}
      {...rest}
    />
  );
}
