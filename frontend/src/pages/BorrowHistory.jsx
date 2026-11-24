import React, { useState, useEffect, useMemo } from 'react';
import { History } from 'lucide-react';
import { getComponents, getBorrowLogs } from '../services/api';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';
import BorrowHistoryTable from '../components/BorrowHistoryTable';
import BorrowStatus from '../components/BorrowStatus';

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

  const activeBorrowsCount = useMemo(
    () => scopedBorrowLogs.filter((log) => !log.returned_at).length,
    [scopedBorrowLogs]
  );

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
          title={isAdmin ? 'All Borrow & Return History' : 'Your Borrow & Return History'}
          subtitle={
            isAdmin
              ? `Complete checkout and return records across all students (${components.length} tracked components).`
              : `Complete record of your component checkouts and returns (${user?.full_name || user?.email || 'User'}).`
          }
          onRefresh={fetchHistoryData}
          refreshLabel="Refresh Data"
          loading={loading}
        />

        <div className="bg-[#1c1c1c] p-6 rounded-lg shadow-lg border border-neutral-800">
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

        {onBackToDashboard && (
          <div>
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-neutral-200 transition"
            >
              Back to Dashboard Overview
            </button>
          </div>
        )}
      </div>
    </Navbar>
  );
}