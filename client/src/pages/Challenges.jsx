import React, { useState, useEffect, useCallback } from 'react';
import { Swords, Inbox, Send } from 'lucide-react';
import ChallengeCard from '../components/challenge/ChallengeCard';
import EmptyState from '../components/ui/EmptyState';
import { motion } from 'framer-motion';
import * as challengeService from '../services/challenge.service';

const FILTER_TABS = [
  { label: 'All', role: 'all' },
  { label: 'Incoming', role: 'incoming' },
  { label: 'Outgoing', role: 'outgoing' },
];

const STATUS_TABS = ['ALL', 'PENDING', 'PAYMENT_PENDING', 'MATCH_ACTIVE', 'COMPLETED', 'REJECTED'];

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { role: roleFilter };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await challengeService.getChallenges(params);
      if (res.success) setChallenges(res.data);
      else setError('Failed to load challenges.');
    } catch {
      setError('Unable to load challenges.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, statusFilter]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleStatusUpdate = async (challengeId, action) => {
    try {
      if (action === 'accept') await challengeService.acceptChallenge(challengeId);
      if (action === 'reject') await challengeService.rejectChallenge(challengeId);
      fetchChallenges();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">
          MY CHALLENGES
        </h1>
        <p className="text-secondary text-sm">Manage your incoming and outgoing challenges.</p>
      </div>

      {/* Role filter tabs */}
      <div className="flex space-x-1 p-1 rounded-xl bg-frost-800/80 border border-frost-50/10 max-w-xs">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.role}
            onClick={() => setRoleFilter(tab.role)}
            className={`flex-1 py-2 text-xs font-heading font-semibold uppercase tracking-wider rounded-lg transition-all duration-300 ${
              roleFilter === tab.role
                ? 'bg-frost-50/10 text-frost-100 shadow-inner'
                : 'text-secondary hover:text-frost-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        {STATUS_TABS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider border transition-all ${
              statusFilter === s
                ? 'bg-frost-50/10 border-frost-50/30 text-frost-100'
                : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />
          ))}
        </div>
      ) : error ? (
        <EmptyState iconName="WifiOff" title="FAILED TO LOAD" message={error} />
      ) : challenges.length === 0 ? (
        <EmptyState
          iconName="Swords"
          title="NO CHALLENGES FOUND"
          message={
            roleFilter === 'incoming'
              ? "You haven't received any challenges yet."
              : roleFilter === 'outgoing'
              ? "You haven't sent any challenges yet."
              : "No challenges found with the selected filters."
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {challenges.map((challenge, i) => (
            <motion.div
              key={challenge._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <ChallengeCard
                challenge={challenge}
                onStatusUpdate={handleStatusUpdate}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Challenges;
