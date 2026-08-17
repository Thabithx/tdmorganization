import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, Bell, User, LogOut, ShieldAlert, Swords, Trophy, Users } from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import FrostLogo from '../frost/FrostLogo';
import * as notificationService from '../../services/notification.service';

const Navbar = () => {
  const { isAuthenticated, isAdmin, logout, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    const fetchUnread = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await notificationService.getNotifications();
        if (res.success) setUnreadCount(res.data.unreadCount);
      } catch (err) {
        // Silently ignore 401 (expected when token expires). Log other errors.
        if (err.response?.status !== 401) {
          console.error('Failed to fetch notifications', err.message);
        }
      }
    };
    fetchUnread();
    if (isAuthenticated) interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `font-heading text-sm font-medium uppercase tracking-wider transition-colors duration-300 hover:text-frost-50 ${
      isActive ? 'text-frost-50 drop-shadow-[0_0_8px_rgba(139,223,255,0.4)]' : 'text-secondary'
    }`;

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-frost-50/10 bg-[#05070D]/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <FrostLogo className="text-xl sm:text-2xl" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/rankings" className={navLinkClass}>Rankings</NavLink>
            <NavLink to="/players" className={navLinkClass}>Players</NavLink>
            <NavLink to="/challenge-rules" className={navLinkClass}>Rules</NavLink>
            {isAuthenticated && (
              <NavLink to="/challenges" className={navLinkClass}>Challenges</NavLink>
            )}
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-950/20 text-red-200 text-xs font-heading font-semibold hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-300"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>ADMIN</span>
                  </Link>
                )}

                {/* Notifications */}
                <Link to="/notifications" className="relative p-2 text-secondary hover:text-frost-50 transition-colors">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-frost-50 text-[10px] font-bold text-[#05070D] animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Profile */}
                <Link to="/profile" className="flex items-center space-x-2 text-secondary hover:text-frost-50 transition-colors px-2 py-1 rounded-lg hover:bg-frost-50/5">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{user.username}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-2 text-secondary hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-secondary hover:text-frost-50 text-sm font-semibold transition-colors">
                  LOGIN
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-frost-50 to-[#58c5f2] text-[#05070D] hover:brightness-110 text-sm font-semibold transition-all duration-300 shadow-[0_0_10px_rgba(139,223,255,0.15)]"
                >
                  JOIN FROST
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 text-secondary hover:text-frost-50 transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-frost-50 text-[10px] font-bold text-[#05070D]">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-secondary hover:text-frost-50 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-frost-50/10 bg-[#05070D] px-4 py-4 space-y-3">
          <NavLink
            to="/rankings"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-secondary hover:text-frost-50 py-2 font-heading font-semibold uppercase tracking-wider"
          >
            Rankings
          </NavLink>
          <NavLink
            to="/players"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-secondary hover:text-frost-50 py-2 font-heading font-semibold uppercase tracking-wider"
          >
            Players
          </NavLink>
          <NavLink
            to="/challenge-rules"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block text-secondary hover:text-frost-50 py-2 font-heading font-semibold uppercase tracking-wider"
          >
            Rules
          </NavLink>
          {isAuthenticated && (
            <NavLink
              to="/challenges"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-secondary hover:text-frost-50 py-2 font-heading font-semibold uppercase tracking-wider"
            >
              Challenges
            </NavLink>
          )}

          <div className="pt-4 border-t border-frost-50/10 space-y-3">
            {isAuthenticated ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center space-x-2 py-2 text-red-200 font-heading font-semibold hover:text-red-400"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>ADMIN DASHBOARD</span>
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2 py-2 text-secondary font-semibold hover:text-frost-50"
                >
                  <User className="w-4 h-4" />
                  <span>MY PROFILE</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full text-left py-2 text-secondary font-semibold hover:text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT</span>
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 border border-frost-50/20 text-frost-100 font-semibold rounded-lg"
                >
                  LOGIN
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-2 bg-gradient-to-r from-frost-50 to-[#58c5f2] text-[#05070D] font-semibold rounded-lg"
                >
                  JOIN FROST
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Nav on Mobile for Auth Quick Access */}
      {isAuthenticated && (
        <div className="fixed bottom-0 left-0 right-0 z-30 h-14 bg-[#05070D]/95 border-t border-frost-50/10 backdrop-blur-md md:hidden flex justify-around items-center">
          <Link to="/rankings" className="flex flex-col items-center text-secondary hover:text-frost-50">
            <Trophy className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold uppercase font-heading">Rankings</span>
          </Link>
          <Link to="/players" className="flex flex-col items-center text-secondary hover:text-frost-50">
            <Users className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold uppercase font-heading">Players</span>
          </Link>
          <Link to="/challenges" className="flex flex-col items-center text-secondary hover:text-frost-50">
            <Swords className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold uppercase font-heading">Challenges</span>
          </Link>
          <Link to="/profile" className="flex flex-col items-center text-secondary hover:text-frost-50">
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-1 font-semibold uppercase font-heading">Profile</span>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
