import React, { useMemo } from 'react';

export default function CategoryStockCard({
  components = [],
  title = 'Stock by Category',
  subtitle = 'Available units per category',
  emptyMessage = 'No components in inventory yet.',
}) {
  const categoryBreakdown = useMemo(() => {
    const map = new Map();

    components.forEach((item) => {
      const rawCat = (item.category || 'Uncategorized').trim();
      const key = rawCat.toLowerCase();
      const entry = map.get(key) || { category: rawCat, qty: 0, count: 0 };
      entry.qty += Number(item.quantity) || 0;
      entry.count += 1;
      map.set(key, entry);
    });

    const rows = Array.from(map.values());
    const maxQty = Math.max(...rows.map((r) => r.qty), 1);

    return rows.map((r) => ({
      ...r,
      widthPercent: Math.round((r.qty / maxQty) * 100),
    }));
  }, [components]);

  return (
    <div className="bg-[#1c1c1c] p-5 rounded-lg shadow-lg border border-neutral-800">
      <h2 className="text-base font-bold text-white">{title}</h2>
      <p className="text-xs text-neutral-400 mb-4">{subtitle}</p>

      {categoryBreakdown.length === 0 ? (
        <p className="text-xs text-neutral-500">{emptyMessage}</p>
      ) : (
        <div className="space-y-3.5">
          {categoryBreakdown.map((row) => (
            <div key={row.category}>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-neutral-200">
                  {row.category}{' '}
                  <span className="font-normal text-neutral-500">
                    ({row.count})
                  </span>
                </span>
                <span className="text-neutral-300 font-medium">
                  {row.qty} units
                </span>
              </div>
              <div className="w-full h-2 bg-[#141414] rounded-full overflow-hidden border border-neutral-800">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${row.widthPercent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}