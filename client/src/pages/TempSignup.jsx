import React, { useState, useEffect } from 'react';
import { Snowflake, CheckCircle, ShieldCheck, Trophy, Sparkles, ArrowRight, UserCheck, Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PlatformBadge } from '../components/ui/Badge';
import FrostParticles from '../components/frost/FrostParticles';
import useAuth from '../hooks/useAuth';
import * as authService from '../services/auth.service';

const PLATFORMS = [
  { value: 'MOBILE', label: 'Mobile' },
  { value: 'IPAD', label: 'iPad' },
  { value: 'EMULATOR', label: 'Emulator' },
];

export default function TempSignup() {
  const { user, login } = useAuth();
  const [registered, setRegistered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    ign: '',
    pubgUid: '',
    platform: 'MOBILE',
  });

  useEffect(() => {
    // If user is already logged in as a normal player OR has registered flag in localStorage, show Welcome screen
    if (user && user.role !== 'ADMIN') {
      setRegistered(true);
    } else if (localStorage.getItem('frost_temp_registered')) {
      setRegistered(true);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.register({
        username: form.ign, // Default username to IGN
        email: form.email,
        password: form.password,
        ign: form.ign,
        pubgUid: form.pubgUid,
        platform: form.platform,
      });

      if (res.success) {
        localStorage.setItem('frost_temp_registered', 'true');
        login(res.data.token, res.data.user);
        setRegistered(true);
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#040810] text-[#F4FBFF] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Particles */}
      <FrostParticles />

      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#8BE3FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md my-auto">
        {/* FROST Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8BE3FF]/20 to-[#0B101A] border border-[#8BE3FF]/30 shadow-[0_0_25px_rgba(139,227,255,0.15)] mb-4">
            <Snowflake className="w-7 h-7 text-[#8BE3FF] animate-pulse" />
          </div>
          <h1 className="font-heading font-black text-3xl sm:text-4xl text-[#F4FBFF] uppercase tracking-widest leading-none">
            FROST
          </h1>
          <p className="text-[#8BE3FF] text-[10px] sm:text-xs font-heading font-bold uppercase tracking-[0.25em] mt-1.5">
            COMPETITIVE NETWORK
          </p>
        </div>

        {/* Dynamic Card: Registration or Welcome Message */}
        {registered ? (
          /* SUCCESS WELCOME VIEW */
          <Card variant="elevated" className="p-8 sm:p-10 border-[#8BE3FF]/20 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.6)] text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)] mx-auto">
              <UserCheck className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#F4FBFF] uppercase tracking-wider">
                Welcome to FROST's Organization ❄️
              </h2>
              <p className="text-[#8BE3FF] text-sm font-heading font-bold uppercase tracking-wide">
                You are officially part of the FROST organization.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#06090F]/80 border border-frost-50/10 text-xs sm:text-sm text-[#8A9AAD] leading-relaxed text-left space-y-2">
              <p>
                After the tournament, we will create a TDM ranking based on player performance. Players in the ranking will have the opportunity to earn money based on their performance.
              </p>
            </div>

            <div className="pt-2">
              <p className="font-heading text-xs font-bold text-[#F4FBFF] uppercase tracking-widest animate-pulse">
                Stay tuned. Your journey starts here.
              </p>
            </div>
          </Card>
        ) : (
          /* REGISTRATION FORM VIEW */
          <Card variant="elevated" className="p-6 sm:p-8 border-frost-50/15 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.6)]">
            <div className="text-center mb-6">
              <h2 className="font-heading text-xl sm:text-2xl font-black text-[#F4FBFF] uppercase tracking-wider">
                JOIN THE FROST ORGANIZATION
              </h2>
              <p className="text-[#8A9AAD] text-xs sm:text-sm mt-1">
                Register now to join the FROST TDM community.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* IGN & PUBG UID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-heading font-bold text-[#4A5D6E] uppercase tracking-widest block mb-1">
                    In-Game Name (IGN)
                  </label>
                  <input
                    type="text"
                    name="ign"
                    required
                    value={form.ign}
                    onChange={handleChange}
                    placeholder="FROST"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06090F] border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-[#8BE3FF]/50 transition-all placeholder-[#2A3D4E]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-heading font-bold text-[#4A5D6E] uppercase tracking-widest block mb-1">
                    PUBG UID
                  </label>
                  <input
                    type="text"
                    name="pubgUid"
                    required
                    value={form.pubgUid}
                    onChange={handleChange}
                    placeholder="5123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06090F] border border-frost-50/10 text-[#F4FBFF] text-sm font-mono focus:outline-none focus:border-[#8BE3FF]/50 transition-all placeholder-[#2A3D4E]"
                  />
                </div>
              </div>

              {/* Platform Selector */}
              <div>
                <label className="text-[10px] font-heading font-bold text-[#4A5D6E] uppercase tracking-widest block mb-1">
                  Gaming Platform
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, platform: p.value }))}
                      className={`py-2 rounded-xl text-xs font-heading font-bold uppercase border transition-all ${
                        form.platform === p.value
                          ? 'bg-[#8BE3FF]/15 border-[#8BE3FF]/40 text-[#8BE3FF] shadow-[0_0_12px_rgba(139,227,255,0.1)]'
                          : 'border-frost-50/10 text-[#4A5D6E] hover:border-frost-50/20 hover:text-[#F4FBFF]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] font-heading font-bold text-[#4A5D6E] uppercase tracking-widest block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="your@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#06090F] border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-[#8BE3FF]/50 transition-all placeholder-[#2A3D4E]"
                />
              </div>

              {/* Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-heading font-bold text-[#4A5D6E] uppercase tracking-widest block mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06090F] border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-[#8BE3FF]/50 transition-all placeholder-[#2A3D4E]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-heading font-bold text-[#4A5D6E] uppercase tracking-widest block mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#06090F] border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-[#8BE3FF]/50 transition-all placeholder-[#2A3D4E]"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full mt-2 py-3 font-heading font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2"
              >
                <span>REGISTER NOW</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        )}

        {/* Footer info */}
        <div className="text-center mt-6">
          <p className="text-[#2A3D4E] text-[10px] font-heading font-semibold uppercase tracking-widest">
            © FROST COMPETITIVE NETWORK
          </p>
        </div>
      </div>
    </div>
  );
}
