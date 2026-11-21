import React, { useState, useEffect, useMemo } from 'react';
import { Package, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import { getComponents, borrowComponent } from '../services/api';
import Navbar from '../components/Navbar';

export default function BorrowItem({
  user,
  isAdmin,
  onLogout,
  onNavigate,
  onBackToDashboard,
}) {
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ EDITED: Use borrower_identity / full_name / email from login if available
  const accountBorrowerName = user?.borrower_identity || user?.full_name || user?.email || '';

  const [borrowData, setBorrowData] = useState({
    component_id: '',
    borrower_name: accountBorrowerName,
    quantity_borrowed: 1,
  });

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const res = await getComponents();
      setComponents(res.data || []);
    } catch (err) {
      console.error('Error loading components:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  // ✅ EDITED: Lock borrower_name to the logged-in student's account on login/update
  useEffect(() => {
    if (!user) return;
    const resolvedName = user?.borrower_identity || user?.full_name || user?.email || '';
    setBorrowData((prev) => ({
      ...prev,
      borrower_name: !isAdmin
        ? resolvedName
        : prev.borrower_name || resolvedName,
    }));
  }, [user, isAdmin]);

  const availableComponents = useMemo(
    () =>
      components.filter(
        (c) => Number(c.quantity) > 0 && c.status !== 'Destroyed'
      ),
    [components]
  );

  const selectedComponent = useMemo(
    () =>
      components.find((c) => String(c.id) === String(borrowData.component_id)),
    [components, borrowData.component_id]
  );

  const filteredComponents = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return components.filter((item) => {
      if (!query) return true;
      const name = (item.name || '').toLowerCase();
      const category = (item.category || '').toLowerCase();
      const status = (item.status || '').toLowerCase();
      return (
        name.includes(query) ||
        category.includes(query) ||
        status.includes(query)
      );
    });
  }, [components, searchTerm]);

  const handleBorrowSubmit = async (e) => {
    e.preventDefault();
    if (!borrowData.component_id) {
      alert('Please select a component to borrow.');
      return;
    }

    // ✅ EDITED: Always submit the logged-in account name for non-admin users
    const finalBorrowerName = !isAdmin
      ? accountBorrowerName
      : borrowData.borrower_name || accountBorrowerName;

    try {
      setSubmitting(true);
      await borrowComponent({
        ...borrowData,
        borrower_name: finalBorrowerName,
        quantity_borrowed: Number(borrowData.quantity_borrowed) || 1,
      });
      alert('Item successfully checked out and inventory updated!');
      setBorrowData({
        component_id: '',
        borrower_name: finalBorrowerName, // ✅ EDITED: Keep account name after submit
        quantity_borrowed: 1,
      });
      await fetchComponents();
    } catch (err) {
      alert(
        'Error borrowing item: ' + (err.response?.data?.error || err.message)
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Navbar
      user={user}
      isAdmin={isAdmin}
      onLogout={onLogout}
      activePage="borrowitem"
      activeSection="borrow-catalog"
      onNavigate={(target, sectionId) => {
        if (
          target === 'borrowitem' ||
          (target === 'dashboard' && sectionId === 'borrow-catalog')
        ) {
          return;
        }
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
              <Package className="text-emerald-400" size={20} />
              Equipment Catalog
            </h2>
            <p className="text-xs text-neutral-400">
              Browse available hardware components and submit a checkout request.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchComponents}
              disabled={loading}
              className="px-3 py-1.5 rounded bg-[#1c1c1c] border border-neutral-800 hover:bg-neutral-800 hover:border-emerald-500/50 text-xs font-medium text-neutral-200 flex items-center gap-1.5 transition"
            >
              <RefreshCw
                size={13}
                className={`${loading ? 'animate-spin' : ''} text-emerald-400`}
              />
              {loading ? 'Refreshing...' : 'Refresh Catalog'}
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

        {/* Borrow Request Form */}
        <div className="bg-[#1c1c1c] p-6 rounded-lg border border-neutral-800 shadow-lg">
          <h3 className="text-base font-bold text-white mb-4">
            Request a Component Checkout
          </h3>

          <form
            onSubmit={handleBorrowSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                Select Component
              </label>
              <select
                value={borrowData.component_id}
                onChange={(e) =>
                  setBorrowData({
                    ...borrowData,
                    component_id: e.target.value,
                    quantity_borrowed: 1,
                  })
                }
                required
                className="w-full rounded bg-[#141414] border border-neutral-700 p-2 text-neutral-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">
                  {availableComponents.length > 0
                    ? '-- Choose Hardware --'
                    : '-- No Hardware Currently In Stock --'}
                </option>
                {availableComponents.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.quantity} available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                Quantity to Borrow
              </label>
              <input
                type="number"
                min="1"
                max={
                  selectedComponent
                    ? Number(selectedComponent.quantity) || 1
                    : undefined
                }
                value={borrowData.quantity_borrowed}
                onChange={(e) =>
                  setBorrowData({
                    ...borrowData,
                    quantity_borrowed: Math.max(
                      1,
                      parseInt(e.target.value, 10) || 1
                    ),
                  })
                }
                required
                className="w-full rounded bg-[#141414] border border-neutral-700 p-2 text-neutral-100 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                Borrower Full Name
              </label>
              {/* ✅ EDITED: Read-only for non-admin accounts so borrows always tie to the logged-in user */}
              <input
                type="text"
                value={borrowData.borrower_name}
                onChange={(e) =>
                  setBorrowData({
                    ...borrowData,
                    borrower_name: e.target.value,
                  })
                }
                readOnly={!isAdmin}
                required
                placeholder="Enter your full name"
                className={`w-full rounded bg-[#141414] border border-neutral-700 p-2 text-neutral-100 placeholder:text-neutral-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                  !isAdmin ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={submitting || availableComponents.length === 0}
                className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-500 font-semibold text-sm disabled:opacity-60 transition"
              >
                {submitting ? 'Submitting Request...' : 'Submit Borrow Request'}
              </button>
            </div>
          </form>
        </div>

        {/* Search Box & Equipment Catalog */}
        <div className="bg-[#1c1c1c] p-6 rounded-lg border border-neutral-800 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Available Equipment Catalog ({filteredComponents.length})
              </h3>
              <p className="text-xs text-neutral-400">
                Click Select on any available item to load it into the checkout
                form.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                size={15}
                className="text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, category, or status..."
                className="w-full pl-9 pr-3 py-1.5 bg-[#141414] border border-neutral-700 rounded text-neutral-100 placeholder:text-neutral-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-400">
              Loading equipment catalog...
            </p>
          ) : filteredComponents.length === 0 ? (
            <p className="text-sm text-neutral-400">
              No components match your current search.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredComponents.map((item) => {
                const isSelected =
                  String(borrowData.component_id) === String(item.id);
                const canBorrow =
                  Number(item.quantity) > 0 && item.status !== 'Destroyed';

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border flex flex-col justify-between transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/25'
                        : 'border-neutral-800 bg-[#141414]'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-base text-white">
                        {item.name}
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Category: {item.category || 'Uncategorized'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded font-semibold ${
                            Number(item.quantity) > 0
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                              : 'bg-red-950/70 text-red-300 border border-red-800/60'
                          }`}
                        >
                          Stock: {item.quantity}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {item.status}
                        </span>
                      </div>

                      {canBorrow && (
                        <button
                          type="button"
                          onClick={() =>
                            setBorrowData((prev) => ({
                              ...prev,
                              component_id: String(item.id),
                              quantity_borrowed: 1,
                            }))
                          }
                          className={`px-2.5 py-1 text-xs font-medium rounded transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-neutral-800 text-emerald-300 hover:bg-neutral-700'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Navbar>
  );
}