import React, { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard } from 'lucide-react';
import { getComponents, getBorrowLogs } from '../services/api';
import Navbar from '../components/Navbar';
import TopWidgets from '../components/TopWidgets';
import PageHeader from '../components/PageHeader';
import MostBorrowed from '../components/MostBorrowed';
import RecentBorrow from '../components/RecentBorrow';
import ReturnItem from './ReturnItem';
import BorrowItem from './BorrowItem';
import BorrowHistory from './BorrowHistory';
import AdminControls from './AdminControls';
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
          <div className="lg:col-span-6">
            <StockCategory components={components} />
          </div>

          <div className="lg:col-span-6">
            <MostBorrowed logs={scopedBorrowLogs} loading={loading} />
          </div>
        </div>

        <RecentBorrow
          logs={recentActivityLogs}
          isAdmin={isAdmin}
          loading={loading}
        />
      </div>
    </Navbar>
  );
}