import React, { useState, useEffect, useMemo } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { getComponents, getBorrowLogs } from '../services/api';
import Navbar from '../components/Navbar';
import ReturnItem from './ReturnItem';
import BorrowItem from './BorrowItem';

export default function Dashboard({ user, onLogout }) {
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const [activeTab, setActiveTab] = useState('student');
  const [studentSection, setStudentSection] = useState('overview');
  const [currentPage, setCurrentPage] = useState('dashboard');

  const [components, setComponents] = useState([]);
  const [borrowLogs, setBorrowLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Force non-admins back to student view if ever set to admin
  useEffect(() => {
    if (!isAdmin && activeTab === 'admin') {
      setActiveTab('student');
    }
  }, [isAdmin, activeTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [compRes, logsRes] = await Promise.all([
        getComponents(),
        getBorrowLogs(),
      ]);
      setComponents(compRes.data || []);
      setBorrowLogs(logsRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showingAdminView = isAdmin && activeTab === 'admin';

  // Scope dashboard borrow logs to the logged-in account unless viewing as Admin
  const visibleBorrowLogs = useMemo(() => {
    if (showingAdminView) {
      return borrowLogs;
    }

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
  }, [borrowLogs, showingAdminView, user]);

  // Derive active & returned counts from visibleBorrowLogs
  const activeBorrows = useMemo(
    () => visibleBorrowLogs.filter((log) => !log.returned_at),
    [visibleBorrowLogs]
  );
  const returnedBorrows = useMemo(
    () => visibleBorrowLogs.filter((log) => Boolean(log.returned_at)),
    [visibleBorrowLogs]
  );
  const totalStock = useMemo(
    () =>
      components.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [components]
  );

  // Stock breakdown by category for progress bars
  const categoryBreakdown = useMemo(() => {
    const map = new Map();
    components.forEach((item) => {
      const cat = item.category || 'Uncategorized';
      const entry = map.get(cat) || { category: cat, qty: 0, count: 0 };
      entry.qty += Number(item.quantity) || 0;
      entry.count += 1;
      map.set(cat, entry);
    });
    const rows = Array.from(map.values());
    const maxQty = Math.max(...rows.map((r) => r.qty), 1);
    return rows.map((r) => ({
      ...r,
      widthPercent: Math.round((r.qty / maxQty) * 100),
    }));
  }, [components]);

  const handleNavigate = (target, sectionOrAnchor) => {
    if (
      target === 'admin' ||
      target === 'admin-controls' ||
      sectionOrAnchor === 'admin-controls'
    ) {
      setCurrentPage('admin');
      return;
    }

    if (target === 'return') {
      setCurrentPage('return');
      return;
    }

    if (target === 'borrowitem' || sectionOrAnchor === 'borrow-catalog') {
      setCurrentPage('borrowitem');
      setStudentSection('borrow-catalog');
      return;
    }

    setCurrentPage('dashboard');
    if (sectionOrAnchor) {
      setStudentSection(sectionOrAnchor);
    } else {
      setStudentSection('overview');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
    setStudentSection('overview');
    fetchDashboardData();
  };

  if (currentPage === 'admin') {
    return (
      <AdminControls
        user={user}
        isAdmin={isAdmin}
        onLogout={onLogout}
        onNavigate={handleNavigate}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  if (currentPage === 'return') {
    return (
      <ReturnItem
        user={user}
        isAdmin={isAdmin}
        onLogout={onLogout}
        onNavigate={handleNavigate}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  if (currentPage === 'borrowitem') {
    return (
      <BorrowItem
        user={user}
        isAdmin={isAdmin}
        onLogout={onLogout}
        onNavigate={handleNavigate}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  return (
    <Navbar
      user={user}
      isAdmin={isAdmin}
      showingAdminView={showingAdminView}
      onSelectTab={setActiveTab}
      studentSection={studentSection}
      onSelectStudentSection={setStudentSection}
      activeBorrowsCount={activeBorrows.length}
      onLogout={onLogout}
      activePage="dashboard"
      activeSection={studentSection}
      onNavigate={handleNavigate}
    >
      <div className="max-w-7xl mx-auto space-y-6 text-neutral-100">
        {/* Sub-Header & Refresh Button */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-neutral-400">
            {showingAdminView
              ? 'Overview of electronics inventory, active borrows, and returns.'
              : `Overview of electronics inventory and your personal borrow/return activity (${
                  user?.full_name || user?.email || 'Student'
                }).`}
          </p>
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-3 py-1.5 rounded bg-[#1c1c1c] border border-neutral-800 hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition"
          >
            <RefreshCw
              size={13}
              className={`${loading ? 'animate-spin' : ''} text-emerald-400`}
            />
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>

        {/* Widgets for Stocks and Borrows */}
        {studentSection === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1c1c1c] p-4 rounded-lg shadow-lg border border-neutral-800">
                <div className="text-xs font-bold uppercase text-neutral-400">
                  Total Stock Units
                </div>
                <div className="text-3xl font-bold text-white my-1">
                  {totalStock}
                </div>
                <div className="text-xs text-neutral-400">
                  {components.length} component types
                </div>
              </div>

              <div className="bg-[#1c1c1c] p-4 rounded-lg shadow-lg border border-neutral-800">
                <div className="text-xs font-bold uppercase text-neutral-400">
                  {showingAdminView ? 'Active Borrows' : 'Your Active Borrows'}
                </div>
                <div className="text-3xl font-bold text-emerald-400 my-1">
                  {activeBorrows.length}
                </div>
                <div className="text-xs text-neutral-400">
                  Currently checked out
                </div>
              </div>

              <div className="bg-[#1c1c1c] p-4 rounded-lg shadow-lg border border-neutral-800">
                <div className="text-xs font-bold uppercase text-neutral-400">
                  {showingAdminView ? 'Returned Items' : 'Your Returned Items'}
                </div>
                <div className="text-3xl font-bold text-white my-1">
                  {returnedBorrows.length}
                </div>
                <div className="text-xs text-neutral-400">
                  Completed returns
                </div>
              </div>

              <div className="bg-[#1c1c1c] p-4 rounded-lg shadow-lg border border-neutral-800">
                <div className="text-xs font-bold uppercase text-neutral-400">
                  {showingAdminView ? 'Total Borrow Logs' : 'Your Borrow Logs'}
                </div>
                <div className="text-3xl font-bold text-white my-1">
                  {visibleBorrowLogs.length}
                </div>
                <div className="text-xs text-neutral-400">
                  {showingAdminView
                    ? 'All recorded checkouts'
                    : 'Your recorded checkouts'}
                </div>
              </div>
            </div>

            {/* Category & Recent Borrow Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 bg-[#1c1c1c] p-5 rounded-lg shadow-lg border border-neutral-800">
                <h2 className="text-base font-bold text-white">
                  Stock by Category
                </h2>
                <p className="text-xs text-neutral-400 mb-4">
                  Available units per category
                </p>

                {categoryBreakdown.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    No components in inventory yet.
                  </p>
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

              <div className="lg:col-span-7 bg-[#1c1c1c] p-5 rounded-lg shadow-lg border border-neutral-800">
                <h2 className="text-base font-bold text-white">
                  Recent Borrow Activity
                </h2>
                <p className="text-xs text-neutral-400 mb-4">
                  Latest checkouts and returns
                </p>

                {visibleBorrowLogs.length === 0 ? (
                  <p className="text-xs text-neutral-500">
                    {showingAdminView
                      ? 'No borrow logs recorded yet.'
                      : 'No borrow logs recorded for your account yet.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[11px] uppercase text-neutral-400">
                          <th className="py-2 pr-2">Log</th>
                          <th className="py-2 px-2">Borrower & Item</th>
                          <th className="py-2 px-2">Status</th>
                          <th className="py-2 px-2 text-right">Qty</th>
                          <th className="py-2 pl-2">Returned At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/80">
                        {visibleBorrowLogs.slice(0, 6).map((log) => (
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
                              </div>
                            </td>
                            <td className="py-2.5 px-2">
                              {log.returned_at ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                                  Returned
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-800 text-neutral-200 border border-neutral-700">
                                  Borrowed
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right font-semibold text-neutral-100">
                              {log.quantity_borrowed}
                            </td>
                            <td className="py-2.5 pl-2 text-neutral-400">
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
            </div>
          </>
        )}

        {/* Borrow & Return History Table */}
        {(studentSection === 'overview' ||
          studentSection === 'borrow-history') && (
          <div className="bg-[#1c1c1c] p-6 rounded-lg shadow-lg border border-neutral-800">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <History className="text-emerald-400" size={20} /> Borrow & Return
              History
            </h2>

            {visibleBorrowLogs.length === 0 ? (
              <p className="text-sm text-neutral-400">
                {showingAdminView
                  ? 'No borrow records found yet.'
                  : 'No borrow records found for your account yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-[#141414] text-neutral-300 text-xs uppercase">
                      <th className="p-2.5">Borrower</th>
                      <th className="p-2.5">Component</th>
                      <th className="p-2.5">Qty</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Returned At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {visibleBorrowLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-neutral-800/30 transition"
                      >
                        <td className="p-2.5 text-neutral-100">
                          {log.borrower_name}
                        </td>
                        <td className="p-2.5 text-neutral-300">
                          {log.components?.name || log.component_id}
                        </td>
                        <td className="p-2.5 text-neutral-100 font-medium">
                          {log.quantity_borrowed}
                        </td>
                        <td className="p-2.5">
                          {log.returned_at ? (
                            <span className="px-2 py-0.5 text-xs rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
                              Returned
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs rounded bg-neutral-800 text-neutral-200 border border-neutral-700 font-semibold">
                              Borrowed
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-neutral-400">
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
        )}
      </div>
    </Navbar>
  );
}