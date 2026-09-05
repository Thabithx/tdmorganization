import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FrostLogo from '../components/frost/FrostLogo';
import FrostParticles from '../components/frost/FrostParticles';
import api from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        setDone(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(res.data.message || 'Reset failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired.');
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
            <p className="text-secondary text-sm uppercase tracking-widest font-semibold">New Password</p>
          </div>

          {done ? (
            <div className="px-8 py-10 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#F4FBFF] uppercase tracking-wider">Password Updated!</h3>
              <p className="text-secondary text-sm">Redirecting you to login...</p>
              <Link to="/login" className="inline-block mt-2 text-frost-50 hover:text-white text-sm font-semibold transition-colors">
                Login Now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              <p className="text-secondary text-sm leading-relaxed">
                Choose a strong new password for your FROST account.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all placeholder-secondary/40"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-frost-50 transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all placeholder-secondary/40"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-frost-50 transition-colors">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">
                SET NEW PASSWORD
              </Button>
              <p className="text-center text-secondary text-xs pt-1">
                <Link to="/login" className="text-frost-50 hover:text-white font-semibold transition-colors">Back to Login</Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
