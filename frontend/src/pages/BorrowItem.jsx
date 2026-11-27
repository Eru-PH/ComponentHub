import React, { useState, useEffect, useMemo } from 'react';
import { Package, Search, Plus, Minus } from 'lucide-react';
import { getComponents, borrowComponent } from '../services/api';
import Navbar from '../components/Navbar';
import PageHeader from '../components/PageHeader';

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

  const accountBorrowerName =
    user?.borrower_identity || user?.full_name || user?.email || '';

  const [borrowerName, setBorrowerName] = useState(accountBorrowerName);
  // Map of { [componentId]: quantitySelected }
  const [selectedItems, setSelectedItems] = useState({});

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

  useEffect(() => {
    if (!user) return;
    const resolvedName =
      user?.borrower_identity || user?.full_name || user?.email || '';
    setBorrowerName((prev) => (!isAdmin ? resolvedName : prev || resolvedName));
  }, [user, isAdmin]);

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

  const handleToggleCard = (item) => {
    const id = String(item.id);
    const maxStock = Number(item.quantity) || 0;
    if (maxStock <= 0 || item.status === 'Destroyed') return;

    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
      } else {
        next[id] = 1;
      }
      return next;
    });
  };

  const handleAdjustQty = (e, item, delta) => {
    e.stopPropagation();
    const id = String(item.id);
    const maxStock = Number(item.quantity) || 0;

    setSelectedItems((prev) => {
      const current = prev[id] || 0;
      const updated = current + delta;
      const next = { ...prev };

      if (updated <= 0) {
        delete next[id];
      } else {
        next[id] = Math.min(maxStock, updated);
      }
      return next;
    });
  };

  const selectedEntries = useMemo(() => {
    return Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => {
        const comp = components.find((c) => String(c.id) === String(id));
        return {
          component_id: id,
          name: comp?.name || id,
          quantity_borrowed: qty,
        };
      });
  }, [selectedItems, components]);

  const totalUnits = useMemo(
    () =>
      selectedEntries.reduce((sum, item) => sum + item.quantity_borrowed, 0),
    [selectedEntries]
  );

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (selectedEntries.length === 0) {
      alert('Please select at least one component from the catalog.');
      return;
    }

    const finalBorrowerName = !isAdmin
      ? accountBorrowerName
      : borrowerName.trim() || accountBorrowerName;

    setSubmitting(true);
    const succeededIds = [];
    const failedMessages = [];

    for (const entry of selectedEntries) {
      try {
        await borrowComponent({
          component_id: entry.component_id,
          borrower_name: finalBorrowerName,
          quantity_borrowed: entry.quantity_borrowed,
        });
        succeededIds.push(String(entry.component_id));
      } catch (err) {
        failedMessages.push(
          `${entry.name}: ${err.response?.data?.error || err.message}`
        );
      }
    }

    setSelectedItems((prev) => {
      const next = { ...prev };
      for (const id of succeededIds) {
        delete next[id];
      }
      return next;
    });

    await fetchComponents();
    setSubmitting(false);

    if (failedMessages.length === 0) {
      alert(
        `Checked out ${succeededIds.length} component(s) (${totalUnits} total units)!`
      );
    } else {
      alert(
        `Checked out ${succeededIds.length} item(s), with errors on:\n\n` +
          failedMessages.join('\n')
      );
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
        <PageHeader
          icon={Package}
          title="Equipment Catalog"
          subtitle="Click components below to select them, adjust quantities, and check out."
          onRefresh={fetchComponents}
          refreshLabel="Refresh Catalog"
          loading={loading}
          onBack={onBackToDashboard}
        />

        {/* Catalog Grid + Checkout Action */}
        <form
          onSubmit={handleCheckoutSubmit}
          className="bg-[#1c1c1c] p-6 rounded-lg border border-neutral-800 shadow-lg space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Available Equipment Catalog ({filteredComponents.length})
              </h3>
              <p className="text-xs text-neutral-400">
                Press any card to select it, then use - / + in the bottom-right
                corner to adjust quantity.
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
                const maxStock = Number(item.quantity) || 0;
                const canBorrow = maxStock > 0 && item.status !== 'Destroyed';
                const qty = selectedItems[String(item.id)] || 0;
                const isSelected = qty > 0;

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={canBorrow ? 0 : -1}
                    aria-pressed={isSelected}
                    onClick={() => canBorrow && handleToggleCard(item)}
                    onKeyDown={(e) => {
                      if (canBorrow && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleToggleCard(item);
                      }
                    }}
                    className={`p-4 rounded-lg border flex flex-col justify-between select-none transition ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-950/25'
                        : canBorrow
                          ? 'border-neutral-800 bg-[#141414] hover:border-neutral-600 cursor-pointer'
                          : 'border-neutral-800/70 bg-[#141414]/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-bold text-base text-white">
                          {item.name}
                        </h4>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Category: {item.category || 'Uncategorized'}
                        </p>
                      </div>

                      {isSelected && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-600 text-white shrink-0">
                          Selected
                        </span>
                      )}
                    </div>

                    {/* Bottom row: Stock on left, -1 / qty / +1 stepper on bottom-right when selected */}
                    <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between gap-2 min-h-[34px]">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded font-semibold ${
                            maxStock > 0
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

                      {isSelected && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center rounded border border-emerald-500/50 bg-[#1c1c1c] overflow-hidden"
                        >
                          <button
                            type="button"
                            onClick={(e) => handleAdjustQty(e, item, -1)}
                            aria-label="Decrease quantity"
                            className="px-2 py-1 text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-2.5 text-xs font-bold text-emerald-300 tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={qty >= maxStock}
                            onClick={(e) => handleAdjustQty(e, item, 1)}
                            aria-label="Increase quantity"
                            className="px-2 py-1 text-neutral-200 hover:bg-neutral-800 hover:text-white disabled:opacity-30 transition"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Borrower + Submit Bar */}
          <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
            <div className="flex-1 max-w-md">
              <label className="block text-xs font-semibold uppercase text-neutral-400 mb-1">
                Borrower Full Name
              </label>
              <input
                type="text"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                readOnly={!isAdmin}
                required
                placeholder="Enter borrower full name"
                className={`w-full rounded bg-[#141414] border border-neutral-700 p-2 text-neutral-100 placeholder:text-neutral-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 ${
                  !isAdmin ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div className="flex items-center gap-3">
              {selectedEntries.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedItems({})}
                  className="px-3 py-2 rounded border border-neutral-700 text-xs text-neutral-300 hover:text-white hover:border-neutral-500 transition"
                >
                  Clear ({selectedEntries.length})
                </button>
              )}

              <button
                type="submit"
                disabled={submitting || selectedEntries.length === 0}
                className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm disabled:opacity-50 transition"
              >
                {submitting
                  ? 'Checking out...'
                  : selectedEntries.length > 0
                    ? `Checkout (${selectedEntries.length} ${
                        selectedEntries.length === 1 ? 'Item' : 'Items'
                      }, ${totalUnits} ${totalUnits === 1 ? 'Unit' : 'Units'})`
                    : 'Select Items to Checkout'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Navbar>
  );
}