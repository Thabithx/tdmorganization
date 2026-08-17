import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';

// Layouts
import Navbar from './components/layout/Navbar';
import AdminLayout from './components/layout/AdminLayout';
import Footer from './components/layout/Footer';

// Public Pages
import Home from './pages/Home';
import Rankings from './pages/Rankings';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import Login from './pages/Login';
import Register from './pages/Register';
import ChallengeRules from './pages/ChallengeRules';
import TempSignup from './pages/TempSignup';

// Authenticated Pages
import ChallengePage from './pages/ChallengePage';
import Challenges from './pages/Challenges';
import MatchHistory from './pages/MatchHistory';
import MyProfile from './pages/MyProfile';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminPlayerDetail from './pages/admin/AdminPlayerDetail';
import AdminRankings from './pages/admin/AdminRankings';
import AdminChallenges from './pages/admin/AdminChallenges';
import AdminChallengeDetail from './pages/admin/AdminChallengeDetail';
import AdminPayments from './pages/admin/AdminPayments';
import AdminMatches from './pages/admin/AdminMatches';
import AdminMatchDetail from './pages/admin/AdminMatchDetail';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminSearch from './pages/admin/AdminSearch';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminSettings from './pages/admin/AdminSettings';

// Route guards
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#05070D]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-frost-50"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const MainLayoutWrapper = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#05070D]">
      <Navbar />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-8">
        {children}
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Admin Dashboard routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="players" element={<AdminPlayers />} />
          <Route path="players/:id" element={<AdminPlayerDetail />} />
          <Route path="rankings" element={<AdminRankings />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="challenges/:id" element={<AdminChallengeDetail />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="matches/:id" element={<AdminMatchDetail />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="disputes" element={<AdminDisputes />} />
          <Route path="search" element={<AdminSearch />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* ===================================================
             TEMPORARY SIGNUP-ONLY MODE
             All non-admin routes serve TempSignup.
             When ready to open the full platform, restore
             the routes below.
        =================================================== */}
        <Route path="/" element={<TempSignup />} />
        <Route path="/register" element={<TempSignup />} />
        <Route path="/login" element={<MainLayoutWrapper><Login /></MainLayoutWrapper>} />

        {/* 404 Fallback → signup page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
