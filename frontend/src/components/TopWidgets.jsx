import React from 'react';

export default function TopWidgets({ items = [], columns = 4 }) {
  if (!items.length) return null;

  const gridClass =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {items.map((item, idx) => (
        <div
          key={item.id || item.label || idx}
          className="bg-[#1c1c1c] p-4 rounded-lg shadow-lg border border-neutral-800"
        >
          <div className="text-xs font-bold uppercase text-neutral-400">
            {item.label}
          </div>
          <div
            className={`text-3xl font-bold my-1 ${
              item.valueClassName || 'text-white'
            }`}
          >
            {item.value}
          </div>
          {item.subtext && (
            <div className="text-xs text-neutral-400">{item.subtext}</div>
          )}
        </div>
      ))}
    </div>
  );
}