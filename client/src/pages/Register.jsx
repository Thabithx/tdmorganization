import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Eye, EyeOff, ChevronDown } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FrostLogo from '../components/frost/FrostLogo';
import FrostParticles from '../components/frost/FrostParticles';
import useAuth from '../hooks/useAuth';
import * as authService from '../services/auth.service';

const PLATFORMS = ['MOBILE', 'IPAD', 'EMULATOR'];

const Register = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    ign: '',
    pubgUid: '',
    platform: 'MOBILE',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fix: use useEffect to avoid setState-during-render warning
  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = formData;
      const res = await authService.register(payload);
      if (res.success) {
        login(res.data.token, res.data.user, res.data.profile);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all placeholder-secondary/40";
  const labelClass = "text-xs font-heading font-semibold text-secondary uppercase tracking-widest";

  return (
    <div className="relative flex items-center justify-center min-h-[80vh] py-8">
      <FrostParticles />

      <div className="relative z-10 w-full max-w-lg px-4">
        <Card variant="elevated" className="overflow-hidden border-frost-50/15">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center space-y-3 border-b border-frost-50/10">
            <FrostLogo className="text-3xl justify-center" />
            <p className="text-secondary text-sm uppercase tracking-widest font-semibold">
              Join the FROST Network
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="frost"
                  className={inputClass}
                />
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@gmail.com"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className={labelClass}>PUBG IGN (In-Game Name)</label>
              <input
                type="text"
                name="ign"
                required
                value={formData.ign}
                onChange={handleChange}
                placeholder="RDHxFROST"
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>PUBG UID</label>
                <input
                  type="text"
                  name="pubgUid"
                  required
                  value={formData.pubgUid}
                  onChange={handleChange}
                  placeholder="5123456789"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Platform</label>
                <div className="relative">
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className={`${inputClass} appearance-none pr-10`}
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p} className="bg-[#0B101A]">{p}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelClass}>Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-frost-50"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className={labelClass}>Confirm Password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Notice */}
            <div className="text-xs text-secondary/70 leading-relaxed p-3 rounded-lg bg-frost-900/50 border border-frost-50/5">
              <span className="text-frost-50 font-semibold">Important:</span> Your IGN, UID, and platform are permanent and cannot be changed later. Make sure they match your PUBG Mobile account exactly.
            </div>

            {error && (
              <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">
              CREATE FROST ACCOUNT
            </Button>

            <p className="text-center text-secondary text-xs pt-1">
              Already registered?{' '}
              <Link to="/login" className="text-frost-50 hover:text-white font-semibold transition-colors">
                Login here
              </Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
