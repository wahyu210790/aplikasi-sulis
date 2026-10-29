import { useState } from 'react';
import { ComboBox } from '../../../components/ui/ComboBox.jsx';
import { formatQty } from '../../../lib/format.js';
import { useDebouncedValue } from '../../../lib/useDebouncedValue.js';
import { useProducts } from '../../products/api.js';
import { unitOf } from '../utils.js';

function toOption(product) {
  return {
    value: product.id,
    label: `${product.name} (${product.sku})`,
    description: product.stock ? `Stok ${formatQty(product.stock.qty, unitOf(product))}` : undefined,
    product,
  };
}

// Searchable picker of ACTIVE products (searches the API by SKU or name). includeInactive: also inactive ones (stock opname).
// value / onChange use a product object (from GET /products, or { id, sku, name, unit_symbol } from a saved document). excludeIds: products already in the list.
export function ProductPicker({ id, value, onChange, excludeIds = [], invalid = false, includeInactive = false }) {
  const [query, setQuery] = useState('');
  const search = useDebouncedValue(query, 300);
  const products = useProducts({ search, is_active: includeInactive ? undefined : 1, per_page: 20 });

  const options = (products.data?.data ?? []).filter((p) => !excludeIds.includes(p.id) || p.id === value?.id).map(toOption);

  return (
    <ComboBox
      id={id}
      value={value ? toOption(value) : null}
      onChange={(option) => onChange(option?.product ?? null)}
      options={options}
      onQueryChange={setQuery}
      loading={products.isFetching}
      placeholder="Cari nama atau SKU barang…"
      emptyText="Barang tidak ditemukan"
      invalid={invalid}
    />
  );
}
