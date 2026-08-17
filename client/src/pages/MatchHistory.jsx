import React, { useState, useEffect } from 'react';
import MatchCard from '../components/match/MatchCard';
import EmptyState from '../components/ui/EmptyState';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import * as matchService from '../services/match.service';

const MatchHistory = () => {
  const { profile } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await matchService.getMyMatchHistory(filter !== 'ALL' ? filter : undefined);
        if (res.success) setMatches(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">MATCH HISTORY</h1>
        <p className="text-secondary text-sm">Your permanent competitive record. All results are immutable.</p>
      </div>

      <div className="flex items-center space-x-2">
        {['ALL', 'WINS', 'LOSSES'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider border transition-all ${
              filter === f
                ? 'bg-frost-50/10 border-frost-50/30 text-frost-100'
                : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState iconName="Flame" title="NO MATCHES YET" message="You haven't competed in any verified matches yet." />
      ) : (
        <div className="space-y-3">
          {matches.map((match, i) => (
            <motion.div
              key={match._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <MatchCard match={match} currentUserId={profile?._id} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MatchHistory;
