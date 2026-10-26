import { Card } from '../../../components/ui/Card.jsx';
import { Money } from '../../../components/ui/Money.jsx';
import { cn } from '../../../lib/cn.js';
import { formatPercent } from '../../../lib/format.js';

function Line({ label, hint, value, sign, strong = false }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-3', strong && 'border-t-2 border-line')}>
      <div className="min-w-0">
        <div className={cn('text-sm', strong ? 'font-semibold text-ink' : 'text-ink')}>{label}</div>
        {hint ? <div className="mt-0.5 text-xs text-muted">{hint}</div> : null}
      </div>
      <div className={cn('flex items-baseline gap-1 text-right', strong ? 'text-lg font-semibold' : 'text-sm')}>
        {sign ? <span className="text-muted">{sign}</span> : null}
        <Money value={value} />
      </div>
    </div>
  );
}

// "Laba" tab (B4.6): contract value − material cost − other costs = profit. Only rendered for Owner/Finance.
export function ProjectProfitTab({ project }) {
  const summary = project.summary;
  if (!summary) return null;

  return (
    <Card title="Perhitungan laba" description="Laba = nilai kontrak − biaya material − biaya lain.">
      <div className="divide-y divide-line">
        <Line label="Nilai kontrak" value={project.contract_value} />
        <Line label="Biaya material" hint="Harga modal rata-rata saat barang keluar, dikurangi pengembalian." value={summary.material_cost} sign="−" />
        <Line label="Biaya lain" hint="Upah, sewa alat, transport dan biaya lain yang dicatat." value={summary.other_costs} sign="−" />
        <Line label="Laba" value={summary.profit} strong />
      </div>
      <p className="mt-3 text-sm text-muted">
        Margin:{' '}
        <span className="font-medium text-ink">{summary.margin_percent === null ? '– (nilai kontrak belum diisi)' : formatPercent(summary.margin_percent)}</span>
      </p>
    </Card>
  );
}
