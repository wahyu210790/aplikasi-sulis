import { useState } from 'react';
import { DateInput } from '../../../components/ui/DateInput.jsx';
import { ErrorState } from '../../../components/ui/ErrorState.jsx';
import { FilterBar } from '../../../components/ui/FilterBar.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { ProductPicker } from '../../stock/components/ProductPicker.jsx';
import { dateRangeError } from '../../../lib/dateRange.js';
import { useCostHistory } from '../api.js';
import { CostHistoryTable } from './CostHistoryTable.jsx';

// "Riwayat Harga Modal" (B9.2 GET /reports/cost-history): purchase prices and the average cost after each, newest first.
// A "Sampai" date before "Dari" shows a message next to the filters and loads nothing (QA bug #8).
export function CostHistoryReport() {
  const [product, setProduct] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const rangeError = dateRangeError(dateFrom, dateTo);
  const history = useCostHistory(
    {
      product_id: product?.id,
      date_from: dateFrom,
      date_to: dateTo,
      page,
      per_page: 20,
    },
    { enabled: !rangeError },
  );

  function changeFilter(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  return (
    <>
      <FilterBar>
        <div className="w-full sm:w-72">
          <ProductPicker id="cost-history-product" value={product} onChange={changeFilter(setProduct)} />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <DateInput
            value={dateFrom}
            onChange={changeFilter(setDateFrom)}
            max={dateTo || undefined}
            invalid={Boolean(rangeError)}
            aria-label="Dari tanggal"
            className="sm:w-40"
          />
          <DateInput
            value={dateTo}
            onChange={changeFilter(setDateTo)}
            min={dateFrom || undefined}
            invalid={Boolean(rangeError)}
            aria-label="Sampai tanggal"
            className="sm:w-40"
          />
        </div>
      </FilterBar>
      {rangeError ? (
        <p role="alert" className="rounded-card border border-line bg-danger-soft px-4 py-3 text-sm text-danger">
          {rangeError}
        </p>
      ) : history.isError ? (
        <div className="rounded-card border border-line bg-surface shadow-sm">
          <ErrorState message={history.error.message} onRetry={() => history.refetch()} />
        </div>
      ) : (
        <>
          <CostHistoryTable
            rows={history.data?.data ?? []}
            loading={history.isLoading}
            showProduct
            filtered={Boolean(product || dateFrom || dateTo)}
          />
          <Pagination meta={history.data?.meta} onPageChange={setPage} />
        </>
      )}
    </>
  );
}
