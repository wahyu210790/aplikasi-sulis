const ICON_TONES = {
  primary: 'bg-primary-soft text-primary',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
};

export function StatCard({ label, value, icon: Icon, tone = 'primary', hint }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        {Icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${ICON_TONES[tone] ?? ICON_TONES.primary}`}>
            <Icon aria-hidden="true" className="h-5 w-5" />
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
