import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button.jsx';
import { FormField } from '../../../components/ui/FormField.jsx';
import { IconButton } from '../../../components/ui/IconButton.jsx';
import { MoneyInput } from '../../../components/ui/MoneyInput.jsx';
import { NumberInput } from '../../../components/ui/NumberInput.jsx';
import { formatQty } from '../../../lib/format.js';
import { newRow, unitOf } from '../utils.js';
import { ProductPicker } from './ProductPicker.jsx';

const MAX_ROWS = 50;

// Item list of a stock form: one card per row with product picker, qty (with "Sisa stok" hint) and,
// when price is given ({ label, field: 'unit_price' | 'unit_cost' }), a rupiah price.
// rows: [{ key, product, qty, price }] (see utils.newRow). errors: field errors from the API, e.g. { 'items.0.qty': '...' }.
export function ItemsEditor({ rows, onChange, errors = {}, price = null }) {
  const usedIds = rows.map((row) => row.product?.id).filter(Boolean);

  function update(index, patch) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function remove(index) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      {errors.items ? (
        <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          {errors.items}
        </p>
      ) : null}
      <ol className="space-y-3">
        {rows.map((row, index) => {
          const unit = unitOf(row.product);
          const productError = errors[`items.${index}.product_id`];
          const qtyError = errors[`items.${index}.qty`];
          const priceError = price ? errors[`items.${index}.${price.field}`] : undefined;
          return (
            <li key={row.key} className="rounded-card border border-line bg-canvas p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <span className="mt-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-semibold text-muted ring-1 ring-line">
                  {index + 1}
                </span>
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-6">
                  <FormField label="Barang" htmlFor={`item-${row.key}-product`} required error={productError} className="sm:col-span-3">
                    <ProductPicker
                      id={`item-${row.key}-product`}
                      value={row.product}
                      onChange={(product) => update(index, { product })}
                      excludeIds={usedIds}
                      invalid={Boolean(productError)}
                    />
                  </FormField>
                  <FormField
                    label="Jumlah"
                    htmlFor={`item-${row.key}-qty`}
                    required
                    error={qtyError}
                    hint={row.product?.stock ? `Sisa stok: ${formatQty(row.product.stock.qty, unit)}` : undefined}
                    className={price ? 'sm:col-span-1' : 'sm:col-span-3'}
                  >
                    <NumberInput
                      id={`item-${row.key}-qty`}
                      value={row.qty}
                      onChange={(qty) => update(index, { qty })}
                      suffix={unit}
                      placeholder="0"
                      invalid={Boolean(qtyError)}
                    />
                  </FormField>
                  {price ? (
                    <FormField label={price.label} htmlFor={`item-${row.key}-price`} required error={priceError} className="sm:col-span-2">
                      <MoneyInput
                        id={`item-${row.key}-price`}
                        value={row.price}
                        onChange={(price) => update(index, { price })}
                        invalid={Boolean(priceError)}
                      />
                    </FormField>
                  ) : null}
                </div>
                <IconButton icon={Trash2} label={`Hapus baris ${index + 1}`} variant="danger" className="mt-6" onClick={() => remove(index)} disabled={rows.length === 1} />
              </div>
            </li>
          );
        })}
      </ol>
      <Button variant="secondary" leftIcon={Plus} fullWidth onClick={() => onChange([...rows, newRow()])} disabled={rows.length >= MAX_ROWS}>
        Tambah barang
      </Button>
    </div>
  );
}
