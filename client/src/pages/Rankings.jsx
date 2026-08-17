import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PlatformTabs from '../components/leaderboard/PlatformTabs';
import TopThreeCards from '../components/leaderboard/TopThreeCards';
import RankingRow from '../components/leaderboard/RankingRow';
import LeaderboardSkeleton from '../components/leaderboard/LeaderboardSkeleton';
import EmptyState from '../components/ui/EmptyState';
import * as rankingService from '../services/ranking.service';

const Rankings = () => {
  const [platform, setPlatform] = useState('MOBILE');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await rankingService.getLeaderboard(platform);
        if (res.success) {
          setLeaderboard(res.data);
        } else {
          setError('Failed to load rankings.');
        }
      } catch (err) {
        setError('Unable to load rankings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [platform]);

  const rank1 = leaderboard.find(r => r.rank === 1);
  const rank2 = leaderboard.find(r => r.rank === 2);
  const rank3 = leaderboard.find(r => r.rank === 3);
  const ranks4to10 = leaderboard.filter(r => r.rank >= 4 && r.rank <= 10);

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-frost-50/10 bg-frost-800/40 text-frost-50 text-xs font-semibold tracking-widest uppercase mb-2">
          <span>Official Standings</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-heading font-extrabold tracking-tight text-[#F4FBFF] uppercase">
          TOP 10 LEADERBOARD
        </h1>
        <p className="text-secondary text-sm max-w-xl mx-auto">
          Only the top 10 hold official rank. Everyone else is unranked. Challenge and prove your worth.
        </p>
      </div>

      {/* Platform Tabs */}
      <PlatformTabs activePlatform={platform} onChange={setPlatform} />

      {/* Leaderboard Content */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LeaderboardSkeleton />
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              iconName="WifiOff"
              title="FAILED TO LOAD"
              message={error}
            />
          </motion.div>
        ) : leaderboard.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              iconName="Trophy"
              title="NO RANKINGS YET"
              message={`No players have been ranked on ${platform} yet.`}
            />
          </motion.div>
        ) : (
          <motion.div
            key={`leaderboard-${platform}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-12"
          >
            {/* Top 3 Podium */}
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-frost-50/10" />
                <span className="text-secondary text-xs font-heading font-semibold uppercase tracking-widest">Champion Tier</span>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-frost-50/10" />
              </div>
              <TopThreeCards rank1={rank1} rank2={rank2} rank3={rank3} />
            </div>

            {/* Ranks 4–10 */}
            {ranks4to10.length > 0 && (
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-frost-50/10" />
                  <span className="text-secondary text-xs font-heading font-semibold uppercase tracking-widest">Challenger Tier</span>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-frost-50/10" />
                </div>
                <div className="w-full max-w-4xl mx-auto space-y-3">
                  {ranks4to10.map((rDoc, i) => (
                    <motion.div
                      key={rDoc._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <RankingRow rankDoc={rDoc} />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Rankings;
