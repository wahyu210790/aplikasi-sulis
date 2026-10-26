import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { INPUT_BASE, INPUT_HEIGHT, borderFor } from './inputStyles.js';

// options: [{ value, label }]. value is the selected option's value ('' or null = nothing selected).
export function Select({ id, value, onChange, options, placeholder = 'Pilih…', invalid = false, disabled = false, className }) {
  const selected = options.find((o) => o.value === value);

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <ListboxButton
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(INPUT_BASE, INPUT_HEIGHT, borderFor(invalid), 'relative flex items-center pr-9 text-left', className)}
      >
        <span className={cn('block truncate', !selected && 'text-muted')}>{selected ? selected.label : placeholder}</span>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 h-4 w-4 text-muted" />
      </ListboxButton>
      <ListboxOptions
        anchor="bottom start"
        className="z-50 max-h-60 w-(--button-width) overflow-auto rounded-control border border-line bg-surface py-1 text-sm shadow-lg [--anchor-gap:4px] focus:outline-none"
      >
        {options.map((option) => (
          <ListboxOption
            key={String(option.value)}
            value={option.value}
            className="group flex cursor-pointer items-center gap-2 px-3 py-2 text-ink data-focus:bg-primary-soft data-selected:font-medium"
          >
            <Check aria-hidden="true" className="invisible h-4 w-4 text-primary group-data-selected:visible" />
            <span className="truncate">{option.label}</span>
          </ListboxOption>
        ))}
      </ListboxOptions>
    </Listbox>
  );
}
