import React from 'react';

export default function BorrowStatus({ returnedAt, size = 'sm' }) {
  const isReturned = Boolean(returnedAt);
  const sizeClass =
    size === 'xs'
      ? 'px-2 py-0.5 rounded text-[10px] font-bold uppercase'
      : 'px-2 py-0.5 rounded text-xs font-semibold';

  if (isReturned) {
    return (
      <span
        className={`${sizeClass} bg-emerald-950 text-emerald-300 border border-emerald-700/60`}
      >
        Returned
      </span>
    );
  }

  return (
    <span
      className={`${sizeClass} bg-neutral-800 text-neutral-200 border border-neutral-700`}
    >
      Borrowed
    </span>
  );
}