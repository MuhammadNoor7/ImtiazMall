import React, { useMemo, useState } from 'react';
import { CleanRecord } from '../lib/types';

type SortKey = keyof Pick<
  CleanRecord,
  'purchaseAmount' | 'purchaseFrequency' | 'brandAffinity' | 'age' | 'incomeLevelLabel' | 'season' | 'year' | 'willPurchase' | 'cluster'
>;

const PAGE_SIZE = 10;

export function DataExplorer({ records }: { records: CleanRecord[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('purchaseAmount');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...records];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * sortDir;
      return ((av as number) - (bv as number)) * sortDir;
    });
    return copy;
  }, [records, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages - 1);
  const pageItems = sorted.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(-1);
    }
    setPage(0);
  };

  const arrow = (key: SortKey) => (sortKey === key ? (sortDir === 1 ? ' ^' : ' v') : '');

  return (
    <div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => toggleSort('purchaseAmount')}>Purchase Amount{arrow('purchaseAmount')}</th>
              <th onClick={() => toggleSort('purchaseFrequency')}>Freq / mo{arrow('purchaseFrequency')}</th>
              <th onClick={() => toggleSort('brandAffinity')}>Brand Affinity{arrow('brandAffinity')}</th>
              <th onClick={() => toggleSort('age')}>Age{arrow('age')}</th>
              <th onClick={() => toggleSort('incomeLevelLabel')}>Income{arrow('incomeLevelLabel')}</th>
              <th onClick={() => toggleSort('season')}>Season{arrow('season')}</th>
              <th onClick={() => toggleSort('year')}>Year{arrow('year')}</th>
              <th onClick={() => toggleSort('willPurchase')}>Will Purchase{arrow('willPurchase')}</th>
              <th onClick={() => toggleSort('cluster')}>Segment{arrow('cluster')}</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((r) => (
              <tr key={r.id}>
                <td>${r.purchaseAmount}</td>
                <td>{r.purchaseFrequency}</td>
                <td>{r.brandAffinity}</td>
                <td>{r.age}</td>
                <td>{r.incomeLevelLabel}</td>
                <td>{r.season}</td>
                <td>{r.year}</td>
                <td>{r.willPurchase ? 'Yes' : 'No'}</td>
                <td>
                  <span className={`cluster-pill c${r.cluster}`}>
                    {r.cluster === 0 ? 'Segment A' : 'Segment B'}
                  </span>
                </td>
              </tr>
            ))}
            {pageItems.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#939aad', padding: '20px' }}>
                  No records match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>Page {pageSafe + 1} of {totalPages}</span>
        <button disabled={pageSafe === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
        <button disabled={pageSafe >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Next</button>
      </div>
    </div>
  );
}
