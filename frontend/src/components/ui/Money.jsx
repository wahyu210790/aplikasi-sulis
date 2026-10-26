import { cn } from '../../lib/cn.js';
import { formatRupiah } from '../../lib/format.js';

// value === undefined: the API hid the field for this role -> render nothing. null -> en dash.
export function Money({ value, className }) {
  if (value === undefined) return null;
  return (
    <span className={cn('tabular-nums whitespace-nowrap', value < 0 && 'text-danger', className)}>
      {value === null ? '–' : formatRupiah(value)}
    </span>
  );
}
