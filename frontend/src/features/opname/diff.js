// Selisih of one opname line = counted − system stock, as a "-3.000" style string (3 decimals), or null
// when a value is missing or not a number. Works in thousandths, so 0.1 + 0.2 style float errors cannot show.
export function qtyDiff(counted, system) {
  if (counted === null || counted === undefined || counted === '' || system === null || system === undefined || system === '') return null;
  const a = Math.round(Number(counted) * 1000);
  const b = Math.round(Number(system) * 1000);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const d = a - b;
  const abs = Math.abs(d);
  return `${d < 0 ? '-' : ''}${Math.floor(abs / 1000)}.${String(abs % 1000).padStart(3, '0')}`;
}

// Text color class for a Selisih value: more = success, less = warning, none = muted.
export function diffClass(value) {
  if (value === null || value === undefined || Number(value) === 0) return 'text-muted';
  return Number(value) > 0 ? 'text-success' : 'text-warning';
}
