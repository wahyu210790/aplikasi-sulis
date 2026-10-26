import { Field, Label, Switch as HeadlessSwitch } from '@headlessui/react';

export function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <Field className="inline-flex items-center gap-3" disabled={disabled}>
      <HeadlessSwitch
        checked={checked}
        onChange={onChange}
        className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-slate-300 transition-colors data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-60 focus:outline-none data-focus:ring-2 data-focus:ring-primary/30"
      >
        <span className="inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition-transform group-data-checked:translate-x-5.5" />
      </HeadlessSwitch>
      {label ? <Label className="text-sm text-ink">{label}</Label> : null}
    </Field>
  );
}
