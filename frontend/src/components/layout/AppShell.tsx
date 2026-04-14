import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ToastContainer } from '../ui/Toast';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { path: '/invoices', label: 'Invoices', icon: '📄' },
  { path: '/invoices/create', label: 'New Invoice', icon: '＋' },
];

const adminNavItems = [
  { path: '/admin/users', label: 'Users', icon: '👥' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  // Desktop: sidebar collapses to icon-only. Mobile: sidebar is a full-width overlay.
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNavItems = user?.role === 'admin' ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — mobile overlay, desktop inline */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:z-auto md:transition-all md:duration-200
        ${desktopOpen ? 'md:w-56' : 'md:w-14'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-peach-100 bg-peach-50 flex-shrink-0">
          <span className="text-2xl">🪑</span>
          {(mobileOpen || desktopOpen) && (
            <span className="font-bold text-gray-800 text-sm leading-tight">Invoice<br/>Manager</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {allNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors
                ${location.pathname === item.path
                  ? 'bg-peach-100 text-gray-900 font-semibold border-r-2 border-peach-400'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              {(mobileOpen || desktopOpen) && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          {(mobileOpen || desktopOpen) && (
            <div className="text-xs text-gray-500 mb-2 truncate">
              <div className="font-medium text-gray-700">{user?.name}</div>
              <div className="capitalize">{user?.role}</div>
            </div>
          )}
          <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <span>↩</span>
            {(mobileOpen || desktopOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
          {/* Mobile: toggle overlay sidebar */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-700 text-xl md:hidden flex-shrink-0"
          >
            ☰
          </button>
          {/* Desktop: collapse/expand inline sidebar */}
          <button
            onClick={() => setDesktopOpen((v) => !v)}
            className="text-gray-500 hover:text-gray-700 text-xl hidden md:block flex-shrink-0"
          >
            ☰
          </button>
          <h1 className="text-gray-700 font-semibold truncate">Invoice Management</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
