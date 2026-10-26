import { cn } from '../../lib/cn.js';
import { formatQty } from '../../lib/format.js';

export function Qty({ value, unit, className }) {
  if (value === undefined || value === null) return <span className={className}>–</span>;
  return <span className={cn('tabular-nums whitespace-nowrap', className)}>{formatQty(value, unit)}</span>;
}
