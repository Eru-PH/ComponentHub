import React, { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, Search, Download, Plus, Trash2, Package,
} from 'lucide-react';
import { getComponents, getBorrowLogs, createComponent, deleteComponent, addComponentStock, exportBorrowLogsCsv,
} from '../services/api';
import Navbar from '../components/Navbar';
import TopWidgets from '../components/TopWidgets';
import PageHeader from '../components/PageHeader';
import BorrowStatus from '../components/BorrowStatus';
import BorrowHistoryTable from '../components/BorrowHistoryTable';

const PRESET_CATEGORIES = [
  'Microcontrollers',
  'Sensors',
  'Actuators & Motors',
  'Modules & Communication',
  'Power & Passive',
  'Displays',
];

export default function AdminControls({
  user,
  isAdmin,
  onLogout,
  onNavigate,
  onBackToDashboard,
}) {
  const [components, setComponents] = useState([]);
  const [borrowLogs, setBorrowLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Log filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // New component form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [stockInputs, setStockInputs] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [compRes, logsRes] = await Promise.all([
        getComponents(),
        getBorrowLogs(),
      ]);
      setComponents(compRes.data || []);
      setBorrowLogs(logsRes.data || []);
    } catch (err) {
      console.error('Error loading admin control data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const activeBorrows = useMemo(
    () => borrowLogs.filter((log) => !log.returned_at),
    [borrowLogs]
  );

  const returnedBorrows = useMemo(
    () => borrowLogs.filter((log) => Boolean(log.returned_at)),
    [borrowLogs]
  );

  const damagedReturnsCount = useMemo(
    () =>
      returnedBorrows.filter(
        (log) => String(log.return_quality || '').toLowerCase() === 'damaged'
      ).length,
    [returnedBorrows]
  );

  const adminWidgets = useMemo(
    () => [
      {
        id: 'catalog-items',
        label: 'Catalog Items',
        value: components.length,
        subtext: 'Registered hardware types',
        valueClassName: 'text-white',
      },
      {
        id: 'all-active-borrows',
        label: 'All Active Borrows',
        value: activeBorrows.length,
        subtext: 'Currently checked out',
        valueClassName: 'text-emerald-400',
      },
      {
        id: 'completed-returns',
        label: 'Completed Returns',
        value: returnedBorrows.length,
        subtext: 'Total returned records',
        valueClassName: 'text-white',
      },
      {
        id: 'damaged-returns',
        label: 'Damaged Returns',
        value: damagedReturnsCount,
        subtext: 'Flagged during check-in',
        valueClassName: 'text-amber-400',
      },
    ],
    [
      components.length,
      activeBorrows.length,
      returnedBorrows.length,
      damagedReturnsCount,
    ]
  );

  const filteredLogs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return borrowLogs.filter((log) => {
      const isReturned = Boolean(log.returned_at);
      if (statusFilter === 'ACTIVE' && isReturned) return false;
      if (statusFilter === 'RETURNED' && !isReturned) return false;

      if (!query) return true;

      const borrower = String(log.borrower_name || '').toLowerCase();
      const componentName = String(
        log.components?.name || log.component_id || ''
      ).toLowerCase();
      const quality = String(log.return_quality || '').toLowerCase();

      return (
        borrower.includes(query) ||
        componentName.includes(query) ||
        quality.includes(query)
      );
    });
  }, [borrowLogs, statusFilter, searchTerm]);

  const handleAddComponent = async (e) => {
    e.preventDefault();
    const finalCategory =
      category === 'OTHER' ? customCategory.trim() : category.trim();

    if (!name.trim() || !finalCategory) return;

    try {
      setSubmitting(true);
      await createComponent({
        name: name.trim(),
        category: finalCategory,
        quantity: Number(quantity) || 0,
      });
      setName('');
      setCategory('');
      setCustomCategory('');
      setQuantity(1);
      await fetchAdminData();
    } catch (err) {
      alert(
        'Error adding component: ' + (err.response?.data?.error || err.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddStock = async (id, amount) => {
    const addAmount = Number(amount);
    if (!addAmount || addAmount <= 0) return;

    try {
      setUpdatingId(id);
      await addComponentStock(id, addAmount);
      setStockInputs((prev) => ({ ...prev, [id]: '' }));
      await fetchAdminData();
    } catch (err) {
      alert(
        'Error adding stock: ' + (err.response?.data?.error || err.message)
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteComponent = async (id, compName) => {
    if (!window.confirm(`Delete "${compName}" from inventory?`)) return;

    try {
      await deleteComponent(id);
      await fetchAdminData();
    } catch (err) {
      alert(
        'Error deleting component: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleExportCsv = async () => {
    try {
      const res = await exportBorrowLogsCsv();
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'borrow_logs_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        'Failed to export CSV: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  return (
    <Navbar
      user={user}
      isAdmin={isAdmin}
      showingAdminView={isAdmin}
      onLogout={onLogout}
      activePage="admin"
      activeSection="admin-controls"
      onNavigate={(target, sectionId) => {
        if (target === 'admin' || target === 'admin-controls') return;
        if (onNavigate) {
          onNavigate(target, sectionId);
        } else if (onBackToDashboard) {
          onBackToDashboard();
        }
      }}
    >
      <div className="max-w-7xl mx-auto space-y-6 text-neutral-100">
        <PageHeader
          icon={ShieldCheck}
          title="Admin Controls & System Logs"
          subtitle="Manage hardware inventory, audit all student checkouts, and export return condition logs."
          onRefresh={fetchAdminData}
          refreshLabel="Refresh Data"
          loading={loading}
          onBack={onBackToDashboard}
          extraActions={
            isAdmin && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-1.5 rounded bg-[#1c1c1c] border border-neutral-800 hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition"
              >
                <Download size={13} className="text-emerald-400" />
                Export CSV
              </button>
            )
          }
        />

        {!isAdmin ? (
          <div className="bg-[#1c1c1c] p-6 rounded-lg border border-neutral-800 text-sm text-neutral-300">
            Admin access is required to view this page.
          </div>
        ) : (
          <>
            <TopWidgets items={adminWidgets} columns={4} />

            {/* Inventory Management Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <form
                onSubmit={handleAddComponent}
                className="lg:col-span-4 bg-[#1c1c1c] p-5 rounded-lg border border-neutral-800 shadow-lg space-y-3"
              >
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus size={16} className="text-emerald-400" /> Add Hardware
                  Component
                </h3>
                <div>
                  <label className="block text-xs uppercase text-neutral-400 mb-1">
                    Component Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arduino Uno R3"
                    className="w-full px-3 py-2 bg-[#141414] border border-neutral-700 rounded text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase text-neutral-400 mb-1">
                    Category
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value !== 'OTHER') {
                        setCustomCategory('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-[#141414] border border-neutral-700 rounded text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="" disabled>
                      Select a category...
                    </option>
                    {PRESET_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="OTHER">Other (Custom)...</option>
                  </select>

                  {category === 'OTHER' && (
                    <input
                      type="text"
                      required
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category name"
                      className="mt-2 w-full px-3 py-2 bg-[#141414] border border-neutral-700 rounded text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs uppercase text-neutral-400 mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141414] border border-neutral-700 rounded text-sm text-neutral-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60 transition"
                >
                  {submitting ? 'Saving...' : 'Add to Inventory'}
                </button>
              </form>

              <div className="lg:col-span-8 bg-[#1c1c1c] p-5 rounded-lg border border-neutral-800 shadow-lg">
                <h3 className="text-base font-bold text-white flex items-center gap-2 mb-3">
                  <Package size={16} className="text-emerald-400" /> Current
                  Inventory ({components.length})
                </h3>
                {components.length === 0 ? (
                  <p className="text-xs text-neutral-400">
                    No components registered yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-neutral-800 bg-[#141414] text-neutral-300 uppercase">
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Category</th>
                          <th className="p-2.5">Available Stock</th>
                          <th className="p-2.5">Add Stock</th>
                          <th className="p-2.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/80">
                        {components.map((comp) => {
                          const isUpdating = updatingId === comp.id;
                          return (
                            <tr
                              key={comp.id}
                              className="hover:bg-neutral-800/30 transition"
                            >
                              <td className="p-2.5 font-semibold text-neutral-100">
                                {comp.name}
                              </td>
                              <td className="p-2.5 text-neutral-400">
                                {comp.category || 'Uncategorized'}
                              </td>
                              <td className="p-2.5 font-semibold text-emerald-400">
                                {comp.quantity}
                              </td>
                              <td className="p-2.5">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleAddStock(comp.id, 1)}
                                    className="px-2 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-semibold disabled:opacity-50 transition"
                                  >
                                    +1
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    onClick={() => handleAddStock(comp.id, 5)}
                                    className="px-2 py-1 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-semibold disabled:opacity-50 transition"
                                  >
                                    +5
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    placeholder="+Qty"
                                    value={stockInputs[comp.id] || ''}
                                    onChange={(e) =>
                                      setStockInputs((prev) => ({
                                        ...prev,
                                        [comp.id]: e.target.value,
                                      }))
                                    }
                                    className="w-16 px-2 py-1 bg-[#141414] border border-neutral-700 rounded text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                                  />
                                  <button
                                    type="button"
                                    disabled={
                                      isUpdating ||
                                      !Number(stockInputs[comp.id]) ||
                                      Number(stockInputs[comp.id]) <= 0
                                    }
                                    onClick={() =>
                                      handleAddStock(
                                        comp.id,
                                        stockInputs[comp.id]
                                      )
                                    }
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold disabled:opacity-40 transition"
                                  >
                                    Add
                                  </button>
                                </div>
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteComponent(comp.id, comp.name)
                                  }
                                  className="px-2 py-1 rounded bg-red-950/60 hover:bg-red-900/70 text-red-300 border border-red-800/60 inline-flex items-center gap-1 transition"
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* All Borrowers Activity Table */}
            <div className="bg-[#1c1c1c] p-6 rounded-lg border border-neutral-800 shadow-lg space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white">
                  All Borrowers&apos; Activity ({filteredLogs.length})
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#141414] border border-neutral-700 rounded px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="ACTIVE">Borrowed (Active)</option>
                    <option value="RETURNED">Returned</option>
                  </select>

                  <div className="relative">
                    <Search
                      size={14}
                      className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search borrower, item, quality..."
                      className="pl-8 pr-3 py-1.5 bg-[#141414] border border-neutral-700 rounded text-xs text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <BorrowHistoryTable
                logs={filteredLogs}
                loading={loading}
                loadingMessage="Loading borrow logs..."
                emptyMessage="No borrow logs match your current filter."
                showLogId={true}
                showCategory={false}
                showReturnQuality={true}
                renderStatus={(log) => (
                  <BorrowStatus returnedAt={log.returned_at} size="sm" />
                )}
              />
            </div>
          </>
        )}
      </div>
    </Navbar>
  );
}