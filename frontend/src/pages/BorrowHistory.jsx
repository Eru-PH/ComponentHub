import React, { useState, useEffect, useMemo } from 'react';
import { History, Search, X } from 'lucide-react';
import { getComponents, getBorrowLogs } from '../services/api';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import BorrowHistoryTable from '../components/BorrowHistoryTable';
import BorrowStatus from '../components/BorrowStatus';

const getLogState = (log) => {
  if (log.status === 'Lost' || log.return_quality === 'Lost') {
    return 'lost';
  }
  if (log.returned_at || log.status === 'Returned') {
    return 'returned';
  }
  return 'borrowed';
};

export default function BorrowHistory({
  user,
  isAdmin,
  onLogout,
  onNavigate,
  onBackToDashboard,
}) {
  const [components, setComponents] = useState([]);
  const [borrowLogs, setBorrowLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'borrowed' | 'returned' | 'lost'

  const fetchHistoryData = async () => {
    try {
      setLoading(true);
      const [compRes, logsRes] = await Promise.all([
        getComponents(),
        getBorrowLogs(),
      ]);
      setComponents(compRes.data || []);
      setBorrowLogs(logsRes.data || []);
    } catch (err) {
      console.error('Error fetching borrow history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const visibleBorrowLogs = useMemo(() => {
    const allowedBorrowers = [
      user?.borrower_identity,
      user?.borrower_key,
      user?.full_name,
      user?.email,
    ]
      .filter(Boolean)
      .map((val) => String(val).trim().toLowerCase());

    if (allowedBorrowers.length === 0) {
      return [];
    }

    return borrowLogs.filter((log) => {
      const logBorrower = (log.borrower_name || '').trim().toLowerCase();
      return allowedBorrowers.includes(logBorrower);
    });
  }, [borrowLogs, user]);

  const scopedBorrowLogs = useMemo(
    () => (isAdmin ? borrowLogs : visibleBorrowLogs),
    [isAdmin, borrowLogs, visibleBorrowLogs]
  );

  const filteredBorrowLogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return scopedBorrowLogs.filter((log) => {
      const state = getLogState(log);

      if (statusFilter !== 'all' && state !== statusFilter) return false;

      if (!query) return true;

      const borrower = String(log.borrower_name || '').toLowerCase();
      const componentName = String(
        log.components?.name || log.component_id || ''
      ).toLowerCase();
      const category = String(log.components?.category || '').toLowerCase();

      return (
        borrower.includes(query) ||
        componentName.includes(query) ||
        category.includes(query)
      );
    });
  }, [scopedBorrowLogs, searchQuery, statusFilter]);

  const activeBorrowsCount = useMemo(
    () => scopedBorrowLogs.filter((log) => getLogState(log) === 'borrowed').length,
    [scopedBorrowLogs]
  );

  const statusCounts = useMemo(() => {
    let borrowed = 0;
    let returned = 0;
    let lost = 0;

    scopedBorrowLogs.forEach((log) => {
      const state = getLogState(log);
      if (state === 'lost') lost += 1;
      else if (state === 'returned') returned += 1;
      else borrowed += 1;
    });

    return {
      all: scopedBorrowLogs.length,
      borrowed,
      returned,
      lost,
    };
  }, [scopedBorrowLogs]);

  const filterOptions = [
    { id: 'all', label: 'All', count: statusCounts.all },
    { id: 'borrowed', label: 'Borrowed', count: statusCounts.borrowed },
    { id: 'returned', label: 'Returned', count: statusCounts.returned },
    { id: 'lost', label: 'Lost', count: statusCounts.lost },
  ];

  const hasActiveFilters =
    searchQuery.trim().length > 0 || statusFilter !== 'all';

  return (
    <Navbar
      user={user}
      isAdmin={isAdmin}
      activeBorrowsCount={activeBorrowsCount}
      onLogout={onLogout}
      activePage="history"
      activeSection="borrow-history"
      onNavigate={onNavigate}
    >
      <div className="max-w-7xl mx-auto space-y-6 text-neutral-100">
        <PageHeader
          icon={History}
          title={
            isAdmin
              ? 'All Borrow & Return History'
              : 'Your Borrow & Return History'
          }
          subtitle={
            isAdmin
              ? `Complete checkout and return records across all students (${components.length} tracked components).`
              : `Complete record of your component checkouts and returns (${user?.full_name || user?.email || 'User'}).`
          }
          onRefresh={fetchHistoryData}
          refreshLabel="Refresh Data"
          loading={loading}
          onBack={onBackToDashboard}
        />

        <div className="bg-[#1c1c1c] p-6 rounded-lg shadow-lg border border-neutral-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={15}
                className="text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isAdmin
                    ? 'Search borrower, component, or category...'
                    : 'Search component or category...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-[#141414] border border-neutral-700 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-400 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="text-neutral-400 hover:text-white absolute right-2.5 top-1/2 -translate-y-1/2 transition"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {filterOptions.map((pill) => {
                const isSelected = statusFilter === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border tabular-nums transition active:scale-[0.98] ${
                      isSelected
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 font-semibold'
                        : 'bg-[#141414] text-neutral-400 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700'
                    }`}
                  >
                    {pill.label}{' '}
                    <span className="ml-1 opacity-80">({pill.count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <BorrowHistoryTable
            logs={filteredBorrowLogs}
            loading={loading}
            loadingMessage="Loading borrow history..."
            emptyMessage={
              hasActiveFilters
                ? 'No matching borrow records for your current filter.'
                : isAdmin
                  ? 'No borrow records found yet.'
                  : 'No borrow records found for your account yet.'
            }
            showCategory={true}
            renderStatus={(log) => {
              const state = getLogState(log);
              if (state === 'lost') {
                return (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-700/60">
                    Lost
                  </span>
                );
              }
              return <BorrowStatus returnedAt={log.returned_at} size="sm" />;
            }}
          />
        </div>
      </div>
    </Navbar>
  );
}