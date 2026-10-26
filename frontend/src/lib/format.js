// Formatting helpers — docs/desain-v2.md B12.8. All output is Indonesian. Pure functions, no React.
const TZ = 'Asia/Jakarta';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function groupThousands(intStr) { return intStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
export function formatRupiah(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = Math.round(Number(value));
  const sign = n < 0 ? '-' : '';
  return `${sign}Rp ${groupThousands(String(Math.abs(n)))}`;
}
export function formatQty(value, unitSymbol) {
  if (value === null || value === undefined || value === '') return '';
  const s = String(value);
  const neg = s.startsWith('-');
  const [i, d = ''] = (neg ? s.slice(1) : s).split('.');
  const dec = d.replace(/0+$/, '');
  const out = (neg ? '-' : '') + groupThousands(String(Number(i))) + (dec ? `,${dec}` : '');
  return unitSymbol ? `${out} ${unitSymbol}` : out;
}
export function parseQty(input) {
  if (input === null || input === undefined) return null;
  const s = String(input).trim().replace(/\./g, '').replace(',', '.');
  return /^\d{1,12}(\.\d{1,3})?$/.test(s) ? s : null;
}
function partsInJakarta(date) {
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return p;
}
export function formatDate(value) {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
  }
  const p = partsInJakarta(new Date(value));
  return `${Number(p.day)} ${MONTHS[Number(p.month) - 1]} ${p.year}`;
}
export function formatDateTime(value) {
  if (!value) return '';
  const p = partsInJakarta(new Date(value));
  return `${Number(p.day)} ${MONTHS[Number(p.month) - 1]} ${p.year}, ${p.hour}.${p.minute} WIB`;
}
export function formatPercent(value) {
  if (value === null || value === undefined || value === '') return '';
  return `${String(value).replace('.', ',')}%`;
}
