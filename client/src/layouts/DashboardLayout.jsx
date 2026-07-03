import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Map,
  CreditCard,
  Package,
  Users,
  LogOut,
  Menu,
  X,
  PlusCircle,
  Truck,
  User,
} from 'lucide-react';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Compile navigation links by role
  const getNavLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Manage Zones', path: '/admin/zones', icon: Map },
          { name: 'Rate Cards', path: '/admin/rate-cards', icon: CreditCard },
          { name: 'Manage Orders', path: '/admin/orders', icon: Package },
          { name: 'Manage Agents', path: '/admin/agents', icon: Users },
        ];
      case 'customer':
        return [
          { name: 'My Orders', path: '/customer/orders', icon: Package },
          { name: 'Create Order', path: '/customer/create-order', icon: PlusCircle },
        ];
      case 'delivery_agent':
        return [
          { name: 'Assigned Orders', path: '/agent/orders', icon: Truck },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const isLinkActive = (path) => {
    return location.pathname === path;
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400 border border-red-500/25';
      case 'delivery_agent':
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/25';
      default:
        return 'bg-brand-500/10 text-brand-400 border border-brand-500/25';
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'delivery_agent') return 'Delivery Agent';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      {/* 1. Desktop Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-900 bg-slate-900/30 md:flex">
        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-900 px-6">
          <Truck className="h-6 w-6 text-brand-500 glow-text" />
          <span className="font-heading text-lg font-bold tracking-tight text-white">LastMile Tracker</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-4 py-6">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isLinkActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-100'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${active ? 'text-white' : 'text-slate-400'}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="border-t border-slate-900 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-slate-900/20 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">{user.name}</p>
              <span className={`inline-block rounded px-1.5 py-0.5 mt-1 text-[10px] font-bold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900/50 hover:text-white"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Wrapper */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-900 bg-slate-950 px-6">
          <div className="flex items-center gap-4">
            {/* Mobile Hamburger menu */}
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white md:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="hidden text-lg font-bold text-white md:block">
              {navLinks.find((l) => isLinkActive(l.path))?.name || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3 md:gap-6">
            {/* Display logged in name on Mobile header */}
            <div className="text-right md:hidden">
              <p className="text-xs font-bold text-white">{user.name}</p>
              <span className={`inline-block rounded px-1 py-0.5 mt-0.5 text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-900 md:hidden" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl border border-slate-900 bg-slate-900/20 px-3.5 py-2 text-xs font-semibold text-slate-400 transition-all hover:border-slate-800 hover:bg-slate-900/50 hover:text-white md:hidden"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* 3. Main Content Panel */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      {/* 4. Mobile Drawer Panel */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />

          {/* Drawer body */}
          <div className="relative flex w-full max-w-xs flex-col bg-slate-900 px-6 py-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Truck className="h-6 w-6 text-brand-500" />
                <span className="text-lg font-bold tracking-tight text-white">LastMile Tracker</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 py-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/20'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                    {link.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center gap-3 p-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                  <span className={`inline-block rounded px-1.5 py-0.5 mt-1 text-[9px] font-bold uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
