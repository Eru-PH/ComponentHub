import React from 'react';
import BorrowStatus from './BorrowStatus';

export default function RecentBorrow({
  logs = [],
  isAdmin = false,
  loading = false,
}) {
  return (
    <div className="bg-[#1c1c1c] p-5 rounded-lg shadow-lg border border-neutral-800 h-full">
      <h2 className="text-base font-bold text-white">
        {isAdmin
          ? 'Recent Student Borrow Activity'
          : 'Your Recent Borrow Activity'}
      </h2>
      <p className="text-xs text-neutral-400 mb-4">
        {isAdmin
          ? 'All checkouts and returns across students'
          : 'Your latest checkouts and returns'}
      </p>

      {loading && logs.length === 0 ? (
        <p className="text-xs text-neutral-500">Loading recent activity...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-neutral-500">
          {isAdmin
            ? 'No borrow logs recorded yet.'
            : 'No borrow logs recorded for your account yet.'}
        </p>
      ) : (
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-neutral-800 text-[11px] uppercase text-neutral-400">
                <th className="py-2 pr-2">Log</th>
                <th className="py-2 px-2">Borrower &amp; Item</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 pl-2 pr-6 text-center">Qty</th>
                <th className="py-2 pl-4">Returned At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-neutral-800/30 transition"
                >
                  <td className="py-2.5 pr-2 font-mono text-neutral-500">
                    #{String(log.id).slice(0, 6)}
                  </td>
                  <td className="py-2.5 px-2">
                    <div className="font-semibold text-neutral-100">
                      {log.borrower_name}
                    </div>
                    <div className="text-neutral-400">
                      {log.components?.name || log.component_id}
                      {log.components?.category
                        ? ` • ${log.components.category}`
                        : ''}
                    </div>
                  </td>
                  <td className="py-2.5 px-2">
                    <BorrowStatus returnedAt={log.returned_at} size="xs" />
                  </td>
                  <td className="py-2.5 pl-2 pr-6 text-center font-semibold text-neutral-100 tabular-nums">
                    {log.quantity_borrowed}
                  </td>
                  <td className="py-2.5 pl-4 text-neutral-400">
                    {log.returned_at
                      ? new Date(log.returned_at).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}