import React from 'react';

export default function BorrowHistoryTable({
  logs = [],
  loading = false,
  loadingMessage = 'Loading borrow logs...',
  emptyMessage = 'No borrow records found.',
  showLogId = false,
  showCategory = true,
  showReturnQuality = false,
  renderStatus,
}) {
  if (loading) {
    return <p className="text-sm text-neutral-400">{loadingMessage}</p>;
  }

  if (logs.length === 0) {
    return <p className="text-sm text-neutral-400">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-800 bg-[#141414] text-neutral-300 text-xs uppercase">
            {showLogId && <th className="p-3">Log ID</th>}
            <th className="p-3">Borrower</th>
            <th className="p-3">Component</th>
            {showCategory && <th className="p-3">Category</th>}
            <th className="p-3">Qty</th>
            <th className="p-3">Status</th>
            {showReturnQuality && <th className="p-3">Return Quality</th>}
            <th className="p-3">Returned At</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/80">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-neutral-800/30 transition">
              {showLogId && (
                <td className="p-3 font-mono text-xs text-neutral-500">
                  #{String(log.id).slice(0, 8)}
                </td>
              )}
              <td className="p-3 font-medium text-neutral-100">
                {log.borrower_name}
              </td>
              <td className="p-3 text-neutral-300">
                {log.components?.name || log.component_id}
              </td>
              {showCategory && (
                <td className="p-3 text-neutral-400">
                  {log.components?.category || 'Uncategorized'}
                </td>
              )}
              <td className="p-3 font-semibold text-neutral-100">
                {log.quantity_borrowed}
              </td>
              <td className="p-3">
                {renderStatus
                  ? renderStatus(log)
                  : log.returned_at
                  ? 'Returned'
                  : 'Borrowed'}
              </td>
              {showReturnQuality && (
                <td className="p-3 text-xs text-neutral-300">
                  {log.returned_at ? log.return_quality || 'Good' : '—'}
                </td>
              )}
              <td className="p-3 text-xs text-neutral-400">
                {log.returned_at
                  ? new Date(log.returned_at).toLocaleString()
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}