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

// Authenticated Pages
import ChallengePage from './pages/ChallengePage';
import Challenges from './pages/Challenges';
import MatchHistory from './pages/MatchHistory';
import MyProfile from './pages/MyProfile';
import Notifications from './pages/Notifications';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminPlayers from './pages/admin/AdminPlayers';
import AdminRankings from './pages/admin/AdminRankings';
import AdminChallenges from './pages/admin/AdminChallenges';
import AdminPayments from './pages/admin/AdminPayments';
import AdminMatches from './pages/admin/AdminMatches';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';

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
          <Route path="rankings" element={<AdminRankings />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="matches" element={<AdminMatches />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* Public/Main routes */}
        <Route path="/" element={<MainLayoutWrapper><Home /></MainLayoutWrapper>} />
        <Route path="/rankings" element={<MainLayoutWrapper><Rankings /></MainLayoutWrapper>} />
        <Route path="/players" element={<MainLayoutWrapper><Players /></MainLayoutWrapper>} />
        <Route path="/players/:id" element={<MainLayoutWrapper><PlayerProfile /></MainLayoutWrapper>} />
        <Route path="/login" element={<MainLayoutWrapper><Login /></MainLayoutWrapper>} />
        <Route path="/register" element={<MainLayoutWrapper><Register /></MainLayoutWrapper>} />
        <Route path="/challenge-rules" element={<MainLayoutWrapper><ChallengeRules /></MainLayoutWrapper>} />

        {/* Protected routes */}
        <Route path="/challenge/:playerId" element={
          <ProtectedRoute>
            <MainLayoutWrapper><ChallengePage /></MainLayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/challenges" element={
          <ProtectedRoute>
            <MainLayoutWrapper><Challenges /></MainLayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <MainLayoutWrapper><MatchHistory /></MainLayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayoutWrapper><MyProfile /></MainLayoutWrapper>
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute>
            <MainLayoutWrapper><Notifications /></MainLayoutWrapper>
          </ProtectedRoute>
        } />

        {/* 404 Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
