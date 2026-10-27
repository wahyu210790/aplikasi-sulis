import { useSearchParams } from 'react-router';
import { useAuth } from '../../../auth/useAuth.js';
import { PageHeader } from '../../../components/ui/PageHeader.jsx';
import { Tabs } from '../../../components/ui/Tabs.jsx';
import { can } from '../../../lib/permissions.js';
import { CostHistoryReport } from '../components/CostHistoryReport.jsx';
import { MovementsReport } from '../components/MovementsReport.jsx';
import { ProjectProfitReport } from '../components/ProjectProfitReport.jsx';
import { StockValueReport } from '../components/StockValueReport.jsx';

const MONEY_TABS = [
  { key: 'laba', label: 'Laba Proyek' },
  { key: 'nilai-stok', label: 'Nilai Stok' },
  { key: 'pergerakan', label: 'Pergerakan Barang' },
  { key: 'harga-modal', label: 'Riwayat Harga Modal' },
];
const GUDANG_TABS = [{ key: 'pergerakan', label: 'Pergerakan Barang' }];

// /laporan — reports hub. Owner/Finance: 4 tabs. Gudang: only "Pergerakan Barang", without money.
// The open tab is kept in ?tab= so other pages (Dashboard) can link to it.
export default function ReportsPage() {
  const { user } = useAuth();
  const showMoney = can(user, 'reports.money');
  const tabs = showMoney ? MONEY_TABS : GUDANG_TABS;
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = tabs.some((t) => t.key === requested) ? requested : tabs[0].key;

  return (
    <>
      <PageHeader
        title="Laporan"
        subtitle={showMoney ? 'Laba proyek, nilai stok, pergerakan barang, dan riwayat harga modal.' : 'Pergerakan barang di gudang.'}
      />
      <Tabs tabs={tabs} value={tab} onChange={(value) => setParams({ tab: value }, { replace: true })} />
      <div className="mt-4">
        {tab === 'laba' ? <ProjectProfitReport /> : null}
        {tab === 'nilai-stok' ? <StockValueReport /> : null}
        {tab === 'pergerakan' ? <MovementsReport showMoney={showMoney} /> : null}
        {tab === 'harga-modal' ? <CostHistoryReport /> : null}
      </div>
    </>
  );
}
