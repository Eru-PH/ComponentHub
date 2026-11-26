import React, { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';

const COLORS = ['#10b981', '#38bdf8', '#a78bfa', '#f59e0b', '#64748b'];

export default function MostBorrowedChart({ logs = [], loading = false }) {
  const [hovered, setHovered] = useState(null);

  const { slices, total } = useMemo(() => {
    const counts = {};
    for (const log of logs) {
      const qty = Number(log.quantity_borrowed) || 0;
      if (qty <= 0) continue;
      const name = log.components?.name || log.component_id || 'Unknown';
      counts[name] = (counts[name] || 0) + qty;
    }

    const sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const grandTotal = sorted.reduce((sum, item) => sum + item.value, 0);
    if (!grandTotal) return { slices: [], total: 0 };

    const top = sorted.slice(0, 4);
    const other = sorted.slice(4).reduce((sum, item) => sum + item.value, 0);
    const items = other > 0 ? [...top, { name: 'Other', value: other }] : top;

    let offset = 0;
    const computed = items.map((item, i) => {
      const pct = (item.value / grandTotal) * 100;
      const start = offset;
      offset += pct;
      return { ...item, pct, start, color: COLORS[i % COLORS.length] };
    });

    return { slices: computed, total: grandTotal };
  }, [logs]);

  const size = 140;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const active = hovered !== null ? slices[hovered] : null;

  return (
    <div className="bg-[#1c1c1c] p-5 rounded-lg shadow-lg border border-neutral-800 h-full flex flex-col justify-between">
      <div className="mb-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-400" />
          Most Borrowed Components
        </h2>
        <p className="text-xs text-neutral-400">By total units checked out</p>
      </div>

      {loading ? (
        <p className="text-xs text-neutral-500">Loading chart...</p>
      ) : slices.length === 0 ? (
        <p className="text-xs text-neutral-500">No borrow data yet.</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262626" strokeWidth={stroke} />
              {slices.map((s, i) => (
                <circle
                  key={s.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={hovered === i ? stroke + 3 : stroke}
                  strokeDasharray={`${(s.pct / 100) * c} ${c}`}
                  strokeDashoffset={-(s.start / 100) * c}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className="transition-all duration-150 cursor-pointer"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2 text-center">
              <span className="text-lg font-bold text-white tabular-nums leading-tight">
                {active ? active.value : total}
              </span>
              <span className="text-[10px] text-neutral-400 truncate max-w-[85px]">
                {active ? active.name : 'Total Units'}
              </span>
            </div>
          </div>

          <ul className="flex-1 w-full space-y-1.5 text-xs">
            {slices.map((s, i) => (
              <li
                key={s.name}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center justify-between gap-2 px-2 py-1 rounded transition cursor-pointer ${
                  hovered === i ? 'bg-neutral-800' : 'hover:bg-neutral-800/40'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0 text-neutral-200 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="tabular-nums text-neutral-400 shrink-0">
                  <strong className="text-white">{s.value}</strong> ({Math.round(s.pct)}%)
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}