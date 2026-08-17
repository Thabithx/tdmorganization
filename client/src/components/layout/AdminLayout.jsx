import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Trophy, Swords, CreditCard, FileText,
  ShieldAlert, Bell, History, Settings, Search, LogOut, ChevronDown,
  ChevronRight, Menu, X, Snowflake, AlertOctagon, BarChart3,
  ClipboardList, RefreshCcw, ScrollText, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_SECTIONS = [
  {
    label: 'OVERVIEW',
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { to: '/admin/search', label: 'Global Search', icon: Search },
    ],
  },
  {
    label: 'COMPETITION',
    items: [
      { to: '/admin/rankings', label: 'Rankings', icon: Trophy },
      { to: '/admin/challenges', label: 'Challenges', icon: Swords },
      { to: '/admin/matches', label: 'Matches', icon: Swords },
    ],
  },
  {
    label: 'PLAYERS',
    items: [
      { to: '/admin/players', label: 'Players', icon: Users },
    ],
  },
  {
    label: 'FINANCE',
    items: [
      { to: '/admin/payments', label: 'Payments', icon: CreditCard },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { to: '/admin/disputes', label: 'Disputes', icon: AlertOctagon },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
  {
    label: 'HISTORY',
    items: [
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

const NavItem = ({ to, label, icon: Icon, exact, onClick }) => {
  const location = useLocation();
  const isActive = exact
    ? location.pathname === to
    : location.pathname.startsWith(to);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={() =>
        `group flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider transition-all duration-150 ${
          isActive
            ? 'bg-frost-50/10 text-[#8BE3FF] border border-frost-50/20'
            : 'text-[#4A5D6E] hover:text-[#8BE3FF] hover:bg-frost-50/5 border border-transparent'
        }`
      }
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </NavLink>
  );
};

export default function AdminLayout() {
  const { user, profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [useLocation().pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = ({ collapsed = false, onNavClick }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-frost-50/10 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8BE3FF]/20 to-[#1A3A4A]/60 border border-[#8BE3FF]/30 flex items-center justify-center flex-shrink-0">
          <Snowflake className="w-4 h-4 text-[#8BE3FF]" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-heading font-black text-[#F4FBFF] text-sm uppercase tracking-widest leading-none">FROST</p>
            <p className="text-[#4A5D6E] text-[9px] uppercase tracking-widest font-semibold mt-0.5">OPS CENTER</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-5 custom-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[9px] font-heading font-bold text-[#2A3D4E] uppercase tracking-[0.2em]">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                collapsed ? (
                  <div key={item.to} title={item.label}>
                    <NavItem {...item} onClick={onNavClick} />
                  </div>
                ) : (
                  <NavItem key={item.to} {...item} onClick={onNavClick} />
                )
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin Profile */}
      <div className={`border-t border-frost-50/10 p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <button
            onClick={handleLogout}
            className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/20 flex items-center justify-center hover:bg-red-900/40 transition-colors"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8BE3FF]/20 to-[#1A3A4A] border border-[#8BE3FF]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-[#8BE3FF] text-xs font-bold font-heading">
                {user?.username?.[0]?.toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[#F4FBFF] text-xs font-heading font-bold uppercase truncate">{user?.username || 'Admin'}</p>
              <p className="text-[#8BE3FF] text-[9px] font-semibold uppercase tracking-widest">ADMIN</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-7 h-7 rounded-lg bg-red-950/30 border border-red-500/10 flex items-center justify-center hover:bg-red-900/40 transition-colors flex-shrink-0"
              title="Logout"
            >
              <LogOut className="w-3 h-3 text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!isAdmin) return null;

  return (
    <div className="flex h-screen bg-[#040810] overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 border-r border-frost-50/[0.06] bg-[#06090F] transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-14' : 'w-52'
        }`}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute left-0 bottom-24 translate-x-full -mr-3 w-5 h-10 bg-[#0A1520] border border-frost-50/10 border-l-0 rounded-r-md flex items-center justify-center text-[#4A5D6E] hover:text-[#8BE3FF] transition-colors z-10"
          style={{ left: sidebarCollapsed ? '3.25rem' : '12.75rem' }}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        ref={drawerRef}
        className={`fixed top-0 left-0 h-full w-64 bg-[#06090F] border-r border-frost-50/10 z-50 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex-shrink-0 h-12 border-b border-frost-50/[0.06] bg-[#06090F]/80 backdrop-blur-sm flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg border border-frost-50/10 flex items-center justify-center text-[#4A5D6E] hover:text-[#8BE3FF] hover:border-frost-50/20 transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>
            {/* Breadcrumb location indicator */}
            <BreadcrumbLabel />
          </div>
          <div className="flex items-center gap-2">
            <NavLink
              to="/admin/search"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#4A5D6E] hover:text-[#8BE3FF] hover:border-frost-50/20 transition-all text-xs font-heading font-semibold uppercase tracking-wide"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </NavLink>
            <div className="px-2 py-1 rounded bg-[#8BE3FF]/10 border border-[#8BE3FF]/20">
              <span className="text-[#8BE3FF] text-[9px] font-heading font-bold uppercase tracking-widest">ADMIN</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <Outlet />
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139,227,255,0.08); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(139,227,255,0.18); }
      `}</style>
    </div>
  );
}

function BreadcrumbLabel() {
  const location = useLocation();
  const pathMap = {
    '/admin': 'Dashboard',
    '/admin/search': 'Global Search',
    '/admin/players': 'Players',
    '/admin/rankings': 'Rankings',
    '/admin/challenges': 'Challenges',
    '/admin/matches': 'Matches',
    '/admin/payments': 'Payments',
    '/admin/disputes': 'Disputes',
    '/admin/notifications': 'Notifications',
    '/admin/audit-logs': 'Audit Logs',
    '/admin/settings': 'Settings',
  };
  const exact = pathMap[location.pathname];
  const label = exact || (location.pathname.includes('/players/') ? 'Player Detail'
    : location.pathname.includes('/matches/') ? 'Match Detail'
    : location.pathname.includes('/challenges/') ? 'Challenge Detail'
    : 'Admin');
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#2A3D4E] text-xs font-heading font-semibold uppercase tracking-widest">FROST OPS</span>
      <ChevronRight className="w-3 h-3 text-[#2A3D4E]" />
      <span className="text-[#8BE3FF] text-xs font-heading font-semibold uppercase tracking-widest">{label}</span>
    </div>
  );
}
