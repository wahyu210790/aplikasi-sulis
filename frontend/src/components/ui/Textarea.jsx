import { cn } from '../../lib/cn.js';
import { INPUT_BASE, borderFor } from './inputStyles.js';

export function Textarea({ invalid = false, rows = 3, className, ...rest }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(INPUT_BASE, 'py-2', borderFor(invalid), className)}
      {...rest}
    />
  );
}
