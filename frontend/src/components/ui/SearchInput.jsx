import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/cn.js';
import { INPUT_BASE, INPUT_HEIGHT } from './inputStyles.js';

// Calls onChange 300 ms after the user stops typing. value = the current search from the parent.
export function SearchInput({ value, onChange, placeholder = 'Cari…', className }) {
  const [text, setText] = useState(value ?? '');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(next) {
    setText(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next.trim()), 300);
  }

  function clear() {
    clearTimeout(timer.current);
    setText('');
    onChange('');
  }

  return (
    <div className={cn('relative w-full sm:w-72', className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(INPUT_BASE, INPUT_HEIGHT, 'border-line pr-9 pl-9 [&::-webkit-search-cancel-button]:hidden')}
      />
      {text ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Hapus pencarian"
          className="absolute top-1/2 right-2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
