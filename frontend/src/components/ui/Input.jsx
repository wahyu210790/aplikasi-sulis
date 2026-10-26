import { cn } from '../../lib/cn.js';
import { INPUT_BASE, INPUT_HEIGHT, borderFor } from './inputStyles.js';

export function Input({ invalid = false, className, type = 'text', ...rest }) {
  return (
    <input
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(INPUT_BASE, INPUT_HEIGHT, borderFor(invalid), className)}
      {...rest}
    />
  );
}
