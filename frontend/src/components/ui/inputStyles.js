// Shared classes for text-like inputs (Input, Textarea, DateInput, NumberInput, MoneyInput, Select button).
export const INPUT_BASE =
  'block w-full rounded-control border bg-surface px-3 text-sm text-ink shadow-sm placeholder:text-muted ' +
  'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ' +
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted';

export const INPUT_HEIGHT = 'h-11 sm:h-10';

export function borderFor(invalid) {
  return invalid ? 'border-danger' : 'border-line';
}
