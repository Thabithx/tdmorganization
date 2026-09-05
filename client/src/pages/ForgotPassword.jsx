import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, Mail } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FrostLogo from '../components/frost/FrostLogo';
import FrostParticles from '../components/frost/FrostParticles';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) setSent(true);
      else setError(res.data.message || 'Something went wrong.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email.');
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
            <p className="text-secondary text-sm uppercase tracking-widest font-semibold">Reset Password</p>
          </div>

          {sent ? (
            <div className="px-8 py-10 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[#F4FBFF] uppercase tracking-wider">Check Your Email</h3>
              <p className="text-secondary text-sm leading-relaxed">
                If an account with that email exists, we have sent a reset link. It expires in <span className="text-frost-50 font-semibold">1 hour</span>.
              </p>
              <p className="text-secondary/60 text-xs">Did not receive it? Check your spam folder.</p>
              <Link to="/login" className="inline-block mt-4 text-frost-50 hover:text-white text-sm font-semibold transition-colors">
                Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-4">
              <p className="text-secondary text-sm leading-relaxed">
                Enter your account email. We will send you a secure link to reset your password.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all placeholder-secondary/40"
                  />
                </div>
              </div>
              {error && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <Button type="submit" variant="primary" size="lg" isLoading={loading} className="w-full mt-2">
                SEND RESET LINK
              </Button>
              <p className="text-center text-secondary text-xs pt-1">
                Remember your password?{' '}
                <Link to="/login" className="text-frost-50 hover:text-white font-semibold transition-colors">Login</Link>
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
