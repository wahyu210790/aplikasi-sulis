// Date filters "Dari tanggal" / "Sampai tanggal" ('YYYY-MM-DD' or ''). docs/desain-v2.md T6.03.
// Returns '' when the range is fine (or one side is empty), otherwise the message shown under the filters.
// Pages do not call the API while the range is wrong (the API would answer 422).
export function dateRangeError(from, to) {
  return from && to && from > to ? 'Tanggal "Sampai" tidak boleh sebelum tanggal "Dari".' : '';
}
