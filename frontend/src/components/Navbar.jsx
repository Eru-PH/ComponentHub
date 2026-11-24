import React from 'react';
import { LogOut } from 'lucide-react';
import ComponentHubLogo from '../assets/ComponentHubLogo.png';

export default function Navbar({
  user,
  isAdmin,
  onLogout,
  activePage = 'dashboard',
  activeSection = 'overview',
  onNavigate,
  children,
}) {
  const handleNavClick = (e, targetPage, anchorId) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(targetPage, anchorId);
    }
  };

  const getItemClass = (isActive) =>
    `w-full text-left block px-3 py-2 rounded transition ${
      isActive
        ? 'bg-neutral-800/90 text-emerald-400 font-bold border-l-2 border-emerald-400'
        : 'text-neutral-300 hover:bg-neutral-800/60 hover:text-white font-normal'
    }`;

  const isAdminActive =
    activePage === 'admin' || activeSection === 'admin-controls';

  const isOverviewActive =
    !isAdminActive &&
    activePage === 'dashboard' &&
    (!activeSection || activeSection === 'overview');

  const isBorrowActive =
    !isAdminActive &&
    (activePage === 'borrowitem' ||
      (activePage === 'dashboard' && activeSection === 'borrow-catalog'));

  const isReturnActive = !isAdminActive && activePage === 'return';

  const isHistoryActive =
    !isAdminActive &&
    activePage === 'dashboard' &&
    activeSection === 'borrow-history';

  return (
    <div className="flex min-h-screen bg-[#121212] text-neutral-100 font-sans">
      {/* Left Sidebar */}
      <aside className="w-60 shrink-0 bg-[#181818] border-r border-neutral-800 flex flex-col justify-between">
        <div>
          <div className="p-4 border-b border-neutral-800 flex items-center gap-2.5">
            <img
              src={ComponentHubLogo}
              alt="ComponentHub Logo"
              className="w-7 h-7 object-contain rounded-md shrink-0"
            />
            <div>
              <div className="font-bold text-sm leading-tight text-white">
                ComponentHub
              </div>
              <div className="text-[11px] text-neutral-400 leading-tight">
                Inventory & Logs
              </div>
            </div>
          </div>

          <nav className="p-3 space-y-1 text-sm">
            <a
              href="#overview"
              onClick={(e) => handleNavClick(e, 'dashboard', 'overview')}
              className={getItemClass(isOverviewActive)}
            >
              Dashboard Overview
            </a>

            <a
              href="#borrow-catalog"
              onClick={(e) => handleNavClick(e, 'borrowitem', 'borrow-catalog')}
              className={getItemClass(isBorrowActive)}
            >
              Borrow & Catalog
            </a>

            <button
              type="button"
              onClick={(e) => handleNavClick(e, 'return', 'return')}
              className={getItemClass(isReturnActive)}
            >
              Return Items Page
            </button>

            <a
              href="#borrow-history"
              onClick={(e) => handleNavClick(e, 'dashboard', 'borrow-history')}
              className={getItemClass(isHistoryActive)}
            >
              Borrow History
            </a>

            {isAdmin && (
              <a
                href="#admin-controls"
                onClick={(e) => handleNavClick(e, 'admin', 'admin-controls')}
                className={getItemClass(isAdminActive)}
              >
                Admin Controls
              </a>
            )}
          </nav>
        </div>

        <div className="p-3 border-t border-neutral-800 text-xs text-neutral-400">
          <div className="font-medium text-neutral-200 truncate">
            {user?.full_name}
          </div>
          <div className="capitalize text-emerald-400/90">{user?.role}</div>
        </div>
      </aside>

      {/* Right Column: Top Header + Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#121212]">
        <header className="bg-[#181818] border-b border-neutral-800 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-bold text-white">
            {isAdminActive
              ? 'Admin Controls & Logs'
              : isBorrowActive
                ? 'Borrow & Catalog'
                : isReturnActive
                  ? 'Return Items'
                  : isHistoryActive
                    ? 'Borrow History'
                    : isAdmin
                      ? 'Admin Dashboard'
                      : 'Dashboard'}
          </h1>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-neutral-400">
              Logged in as{' '}
              <strong className="text-neutral-100">{user?.full_name}</strong> (
              {user?.role})
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-800/70 text-red-200 text-xs font-medium flex items-center gap-1 transition"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}