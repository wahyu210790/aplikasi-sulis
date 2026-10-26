import { useState } from 'react';
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { Spinner } from './Spinner.jsx';
import { INPUT_BASE, INPUT_HEIGHT, borderFor } from './inputStyles.js';

// Searchable select. options: [{ value, label, description? }]. value / onChange use the whole option object (or null).
// Without onQueryChange it filters options locally. With onQueryChange the parent loads options from the API.
export function ComboBox({
  id,
  value,
  onChange,
  options,
  onQueryChange,
  loading = false,
  placeholder = 'Ketik untuk mencari…',
  emptyText = 'Tidak ditemukan',
  invalid = false,
  disabled = false,
}) {
  const [query, setQuery] = useState('');

  const filtered =
    onQueryChange || query === '' ? options : options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()));

  function handleQuery(text) {
    setQuery(text);
    if (onQueryChange) onQueryChange(text);
  }

  return (
    <Combobox value={value} onChange={onChange} onClose={() => setQuery('')} disabled={disabled} by="value">
      <div className="relative">
        <ComboboxInput
          id={id}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          displayValue={(option) => option?.label ?? ''}
          onChange={(e) => handleQuery(e.target.value)}
          placeholder={placeholder}
          className={cn(INPUT_BASE, INPUT_HEIGHT, borderFor(invalid), 'pr-9')}
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center px-3 text-muted" aria-label="Tampilkan pilihan">
          {loading ? <Spinner /> : <ChevronsUpDown aria-hidden="true" className="h-4 w-4" />}
        </ComboboxButton>
      </div>
      <ComboboxOptions
        anchor="bottom start"
        className="z-50 max-h-64 w-(--input-width) overflow-auto rounded-control border border-line bg-surface py-1 text-sm shadow-lg [--anchor-gap:4px] empty:invisible"
      >
        {filtered.length === 0 && !loading ? (
          <div className="px-3 py-2 text-muted">{emptyText}</div>
        ) : (
          filtered.map((option) => (
            <ComboboxOption
              key={String(option.value)}
              value={option}
              className="group flex cursor-pointer items-start gap-2 px-3 py-2 data-focus:bg-primary-soft"
            >
              <Check aria-hidden="true" className="invisible mt-0.5 h-4 w-4 shrink-0 text-primary group-data-selected:visible" />
              <div className="min-w-0">
                <div className="truncate text-ink">{option.label}</div>
                {option.description ? <div className="truncate text-xs text-muted">{option.description}</div> : null}
              </div>
            </ComboboxOption>
          ))
        )}
      </ComboboxOptions>
    </Combobox>
  );
}
