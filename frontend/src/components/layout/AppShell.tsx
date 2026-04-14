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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const allNavItems = user?.role === 'admin' ? [...navItems, ...adminNavItems] : navItems;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} bg-white border-r border-gray-200 flex flex-col transition-all`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 py-4 border-b border-peach-100 bg-peach-50">
          <span className="text-2xl">🪑</span>
          {sidebarOpen && <span className="font-bold text-gray-800 text-sm leading-tight">Invoice<br/>Manager</span>}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4">
          {allNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                ${location.pathname === item.path
                  ? 'bg-peach-100 text-gray-900 font-semibold border-r-2 border-peach-400'
                  : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <span className="text-base">{item.icon}</span>
              {sidebarOpen && item.label}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-gray-100 p-3">
          {sidebarOpen && (
            <div className="text-xs text-gray-500 mb-2 truncate">
              <div className="font-medium text-gray-700">{user?.name}</div>
              <div className="capitalize">{user?.role}</div>
            </div>
          )}
          <button onClick={logout} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <span>↩</span>{sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen((v) => !v)} className="text-gray-500 hover:text-gray-700 text-lg">☰</button>
          <h1 className="text-gray-700 font-semibold">Invoice Management</h1>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
