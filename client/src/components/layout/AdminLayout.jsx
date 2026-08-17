import React from 'react';
import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Swords, CreditCard, Flame, ShieldAlert, History } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import FrostLogo from '../frost/FrostLogo';

const AdminLayout = () => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#05070D]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-frost-50"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const linkClass = ({ isActive }) =>
    `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
      isActive
        ? 'bg-frost-50/10 border-l-4 border-frost-50 text-frost-100 shadow-[0_0_15px_rgba(139,223,255,0.05)]'
        : 'text-secondary hover:bg-frost-50/5 hover:text-frost-100'
    }`;

  return (
    <div className="flex min-h-screen bg-[#05070D]">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-frost-50/10 bg-[#0B101A]">
        {/* Brand header */}
        <div className="flex h-16 items-center px-6 border-b border-frost-50/10">
          <NavLink to="/" className="flex items-center">
            <FrostLogo className="text-xl" />
          </NavLink>
        </div>

        {/* Sidebar Nav */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          <NavLink to="/admin" end className={linkClass}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/players" className={linkClass}>
            <Users className="w-4 h-4" />
            <span>Players</span>
          </NavLink>
          <NavLink to="/admin/rankings" className={linkClass}>
            <Trophy className="w-4 h-4" />
            <span>Rankings</span>
          </NavLink>
          <NavLink to="/admin/challenges" className={linkClass}>
            <Swords className="w-4 h-4" />
            <span>Challenges</span>
          </NavLink>
          <NavLink to="/admin/payments" className={linkClass}>
            <CreditCard className="w-4 h-4" />
            <span>Payments</span>
          </NavLink>
          <NavLink to="/admin/matches" className={linkClass}>
            <Flame className="w-4 h-4" />
            <span>Matches</span>
          </NavLink>
          <NavLink to="/admin/audit-logs" className={linkClass}>
            <ShieldAlert className="w-4 h-4" />
            <span>Audit Logs</span>
          </NavLink>
        </nav>
      </aside>

      {/* Main panel */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile admin nav header */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 border-b border-frost-50/10 bg-[#0B101A] relative z-20">
          <NavLink to="/" className="flex items-center">
            <FrostLogo className="text-lg" />
          </NavLink>
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded border border-red-500/20 bg-red-950/20 text-red-200 text-[10px] font-bold">
            <ShieldAlert className="w-3 h-3" />
            <span>ADMIN MODE</span>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-8">
          {/* Mobile Admin Bottom Nav bar */}
          <div className="md:hidden fixed bottom-14 left-0 right-0 z-30 h-12 bg-[#0B101A] border-t border-frost-50/10 flex justify-around items-center">
            <NavLink to="/admin" end className="text-secondary hover:text-frost-50 p-2">
              <LayoutDashboard className="w-4 h-4" />
            </NavLink>
            <NavLink to="/admin/players" className="text-secondary hover:text-frost-50 p-2">
              <Users className="w-4 h-4" />
            </NavLink>
            <NavLink to="/admin/rankings" className="text-secondary hover:text-frost-50 p-2">
              <Trophy className="w-4 h-4" />
            </NavLink>
            <NavLink to="/admin/challenges" className="text-secondary hover:text-frost-50 p-2">
              <Swords className="w-4 h-4" />
            </NavLink>
            <NavLink to="/admin/payments" className="text-secondary hover:text-frost-50 p-2">
              <CreditCard className="w-4 h-4" />
            </NavLink>
            <NavLink to="/admin/matches" className="text-secondary hover:text-frost-50 p-2">
              <Flame className="w-4 h-4" />
            </NavLink>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
