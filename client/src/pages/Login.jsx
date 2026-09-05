import React, { useEffect } from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FrostLogo from '../components/frost/FrostLogo';
import FrostParticles from '../components/frost/FrostParticles';
import useAuth from '../hooks/useAuth';
import * as authService from '../services/auth.service';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fix: use useEffect to avoid setState-during-render
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authService.login(formData.email, formData.password);
      if (res.success) {
        login(res.data.token, res.data.user, res.data.profile);
        navigate('/');
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-[80vh]">
      <FrostParticles />
      <div className="relative z-10 w-full max-w-md px-4">
        <Card variant="elevated" className="overflow-hidden border-frost-50/15">
          <div className="px-8 pt-8 pb-6 text-center space-y-3 border-b border-frost-50/10">
            <FrostLogo className="text-3xl justify-center" />
            <p className="text-secondary text-sm uppercase tracking-widest font-semibold">Enter the Arena</p>
          </div>
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all placeholder-secondary/40"
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" className="text-xs text-secondary hover:text-frost-50 transition-colors">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 pr-12 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all placeholder-secondary/40"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-frost-50 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">LOGIN TO FROST</Button>
            <p className="text-center text-secondary text-xs pt-2">
              Don't have an account?{' '}
              <Link to="/register" className="text-frost-50 hover:text-white font-semibold transition-colors">Join FROST</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
