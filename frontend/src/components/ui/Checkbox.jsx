export function Checkbox({ id, checked, onChange, label, disabled = false }) {
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-line text-primary accent-primary focus:ring-2 focus:ring-primary/30"
      />
      {label}
    </label>
  );
}
