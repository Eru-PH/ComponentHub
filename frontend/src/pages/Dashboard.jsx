import React, { useState, useEffect, useMemo } from 'react';
import { History, LayoutDashboard } from 'lucide-react';
import { getComponents, getBorrowLogs } from '../services/api';
import Navbar from '../components/Navbar';
import TopWidgets from '../components/TopWidgets';
import PageHeader from '../components/PageHeader';
import ReturnItem from './ReturnItem';
import BorrowItem from './BorrowItem';
import BorrowHistory from './BorrowHistory';
import BorrowHistoryTable from '../components/BorrowHistoryTable';
import AdminControls from './AdminControls';
import BorrowStatus from '../components/BorrowStatus';
import StockCategory from '../components/StockCategory';

export default function Dashboard({ user, onLogout }) {
  const isAdmin = (user?.role || '').toLowerCase() === 'admin';

  const [studentSection, setStudentSection] = useState('overview');
  const [currentPage, setCurrentPage] = useState('dashboard');

  const [components, setComponents] = useState([]);
  const [borrowLogs, setBorrowLogs] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Admins see all borrowers' logs (Student Test 1, Student Test 2, etc.); students see their own
  const scopedBorrowLogs = useMemo(
    () => (isAdmin ? borrowLogs : visibleBorrowLogs),
    [isAdmin, borrowLogs, visibleBorrowLogs]
  );

  const recentActivityLogs = useMemo(() => {
    return isAdmin ? scopedBorrowLogs : scopedBorrowLogs.slice(0, 6);
  }, [isAdmin, scopedBorrowLogs]);

  const activeBorrows = useMemo(
    () => scopedBorrowLogs.filter((log) => !log.returned_at),
    [scopedBorrowLogs]
  );
  const returnedBorrows = useMemo(
    () => scopedBorrowLogs.filter((log) => Boolean(log.returned_at)),
    [scopedBorrowLogs]
  );
  const totalStock = useMemo(
    () =>
      components.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [components]
  );

  const dashboardWidgets = useMemo(
    () => [
      {
        id: 'total-stock',
        label: 'Total Stock Units',
        value: totalStock,
        subtext: `${components.length} component types`,
        valueClassName: 'text-white',
      },
      {
        id: 'active-borrows',
        label: isAdmin ? 'Active Borrows' : 'Your Active Borrows',
        value: activeBorrows.length,
        subtext: 'Currently checked out',
        valueClassName: 'text-emerald-400',
      },
      {
        id: 'returned-items',
        label: isAdmin ? 'Returned Items' : 'Your Returned Items',
        value: returnedBorrows.length,
        subtext: 'Completed returns',
        valueClassName: 'text-white',
      },
      {
        id: 'borrow-logs',
        label: isAdmin ? 'Total Borrow Logs' : 'Your Borrow Logs',
        value: scopedBorrowLogs.length,
        subtext: isAdmin ? 'All recorded checkouts' : 'Your recorded checkouts',
        valueClassName: 'text-white',
      },
    ],
    [
      totalStock,
      components.length,
      isAdmin,
      activeBorrows.length,
      returnedBorrows.length,
      scopedBorrowLogs.length,
    ]
  );

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

    if (target === 'history' || sectionOrAnchor === 'borrow-history') {
      setCurrentPage('history');
      setStudentSection('borrow-history');
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

  if (currentPage === 'history') {
    return (
      <BorrowHistory
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
      studentSection={studentSection}
      onSelectStudentSection={setStudentSection}
      activeBorrowsCount={activeBorrows.length}
      onLogout={onLogout}
      activePage="dashboard"
      activeSection={studentSection}
      onNavigate={handleNavigate}
    >
      <div className="max-w-7xl mx-auto space-y-6 text-neutral-100">
        <PageHeader
          icon={LayoutDashboard}
          title={isAdmin ? 'Admin Dashboard' : 'Dashboard Overview'}
          subtitle={
            isAdmin
              ? `System inventory overview and all student borrow/return activity (${user?.full_name || user?.email || 'Admin'}).`
              : `Overview of electronics inventory and your personal borrow/return activity (${user?.full_name || user?.email || 'User'}).`
          }
          onRefresh={fetchDashboardData}
          refreshLabel="Refresh Data"
          loading={loading}
        />

        <TopWidgets items={dashboardWidgets} columns={4} />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <StockCategory components={components} />
          </div>

          <div className="lg:col-span-7 bg-[#1c1c1c] p-5 rounded-lg shadow-lg border border-neutral-800">
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

            {recentActivityLogs.length === 0 ? (
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
                      <th className="py-2 px-2 text-right">Qty</th>
                      <th className="py-2 pl-2">Returned At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/80">
                    {recentActivityLogs.map((log) => (
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

        <div className="bg-[#1c1c1c] p-6 rounded-lg shadow-lg border border-neutral-800">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <History className="text-emerald-400" size={20} />{' '}
            {isAdmin
              ? 'All Borrow & Return History'
              : 'Your Borrow & Return History'}
          </h2>

          <BorrowHistoryTable
            logs={scopedBorrowLogs}
            loading={loading}
            loadingMessage="Loading borrow history..."
            emptyMessage={
              isAdmin
                ? 'No borrow records found yet.'
                : 'No borrow records found for your account yet.'
            }
            showCategory={true}
            renderStatus={(log) => (
              <BorrowStatus returnedAt={log.returned_at} size="sm" />
            )}
          />
        </div>
      </div>
    </Navbar>
  );
}