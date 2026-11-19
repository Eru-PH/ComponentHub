import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { getBorrowLogs, returnComponent } from '../services/api';
import Navbar from '../components/Navbar';

export default function ReturnItem({
  user,
  isAdmin,
  onLogout,
  onNavigate,
  onBackToDashboard,
}) {
  const [borrowLogs, setBorrowLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getBorrowLogs();
      setBorrowLogs(res.data || []);
    } catch (err) {
      console.error('Error loading borrow logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const activeBorrows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return borrowLogs
      .filter((log) => !log.returned_at)
      .filter((log) => {
        if (!query) return true;
        const borrower = (log.borrower_name || '').toLowerCase();
        const componentName = (
          log.components?.name || String(log.component_id || '')
        ).toLowerCase();
        return borrower.includes(query) || componentName.includes(query);
      });
  }, [borrowLogs, searchTerm]);

  const handleReturn = async (logId) => {
    try {
      setReturningId(logId);
      await returnComponent(logId);
      alert('Item returned and inventory stock updated!');
      await fetchLogs();
    } catch (err) {
      alert(
        'Error returning item: ' + (err.response?.data?.error || err.message)
      );
    } finally {
      setReturningId(null);
    }
  };

  return (
    <Navbar
      user={user}
      isAdmin={isAdmin}
      onLogout={onLogout}
      activePage="return"
      activeSection="return"
      onNavigate={(target, sectionId) => {
        if (target === 'return') return;
        if (onNavigate) {
          onNavigate(target, sectionId);
        } else if (onBackToDashboard) {
          onBackToDashboard();
        }
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6 text-neutral-100">
        {/* Top Page Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <RotateCcw className="text-emerald-400" size={20} /> Return
              Borrowed Equipment
            </h2>
            <p className="text-xs text-neutral-400">
              Select an active checkout below to return hardware and restore
              stock.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-[#1c1c1c] border border-neutral-800 hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition"
            >
              <RefreshCw
                size={13}
                className={`${loading ? 'animate-spin' : ''} text-emerald-400`}
              />
              {loading ? 'Refreshing...' : 'Refresh List'}
            </button>

            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
        </div>

        {/* Summary & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1c1c1c] p-4 rounded-lg border border-neutral-800 shadow-lg">
            <div className="text-[11px] font-bold uppercase text-neutral-400">
              Items Awaiting Return
            </div>
            <div className="text-3xl font-bold text-emerald-400 mt-1">
              {activeBorrows.length}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Active unreturned records
            </div>
          </div>

          <div className="md:col-span-2 bg-[#1c1c1c] p-4 rounded-lg border border-neutral-800 shadow-lg flex flex-col justify-center">
            <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1.5">
              Search by Borrower or Component
            </label>
            <div className="relative">
              <Search
                size={15}
                className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type student name or component (e.g. Arduino Uno, Sensor)..."
                className="w-full pl-9 pr-3 py-2 bg-[#141414] border border-neutral-700 rounded text-neutral-100 placeholder:text-neutral-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Interactive Return Table */}
        <div className="bg-[#1c1c1c] p-6 rounded-lg border border-neutral-800 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4">
            Active Borrowed Items
          </h3>

          {loading ? (
            <p className="text-sm text-neutral-400">Loading active borrows...</p>
          ) : activeBorrows.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No active borrowed items match your current view.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-[#141414] text-neutral-300 text-xs uppercase">
                    <th className="p-3">Log ID</th>
                    <th className="p-3">Borrower</th>
                    <th className="p-3">Component</th>
                    <th className="p-3">Qty</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/80">
                  {activeBorrows.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-neutral-800/30 transition"
                    >
                      <td className="p-3 font-mono text-xs text-neutral-500">
                        #{String(log.id).slice(0, 8)}
                      </td>
                      <td className="p-3 font-medium text-neutral-100">
                        {log.borrower_name}
                      </td>
                      <td className="p-3 text-neutral-300">
                        {log.components?.name || log.component_id}
                      </td>
                      <td className="p-3 font-semibold text-neutral-100">
                        {log.quantity_borrowed}
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          disabled={returningId === log.id}
                          onClick={() => handleReturn(log.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded text-xs font-semibold disabled:opacity-60 transition"
                        >
                          {returningId === log.id
                            ? 'Returning...'
                            : 'Return Item'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Navbar>
  );
}