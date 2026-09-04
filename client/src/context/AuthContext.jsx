import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [profile, setProfile] = useState(null);
  const [declineCount, setDeclineCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setUser(res.data.data.user);
          setProfile(res.data.data.profile);
          setDeclineCount(res.data.data.declineCount || 0);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Fetch me error', err);
        // Only log out if it is an authentication error (401 or 403).
        // If it's a network error/server error (like Render cold starts), preserve the token.
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  const login = (newToken, userData, profileData, declineCountData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setProfile(profileData);
    setDeclineCount(declineCountData || 0);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setProfile(null);
    setDeclineCount(0);
  };

  const updateLocalProfile = (updatedProfile) => {
    setProfile(updatedProfile);
  };

  const value = {
    user,
    token,
    profile,
    declineCount,
    loading,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    updateLocalProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
