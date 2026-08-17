import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import PlayerCard from '../components/player/PlayerCard';
import PlatformTabs from '../components/leaderboard/PlatformTabs';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import * as playerService from '../services/player.service';

const RANK_FILTERS = ['ALL', 'RANKED', 'UNRANKED'];

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [rankFilter, setRankFilter] = useState('ALL');

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (platform !== 'ALL') params.platform = platform;
      if (rankFilter !== 'ALL') params.rankFilter = rankFilter;
      const res = await playerService.getPlayers(params);
      if (res.success) setPlayers(res.data);
      else setError('Failed to load players.');
    } catch {
      setError('Unable to load players. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [search, platform, rankFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(timer);
  }, [fetchPlayers]);

  const platformOptions = ['ALL', 'MOBILE', 'IPAD', 'EMULATOR'];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-4xl sm:text-5xl font-heading font-extrabold tracking-tight text-[#F4FBFF] uppercase">
          PLAYER DIRECTORY
        </h1>
        <p className="text-secondary text-sm">
          Find any registered player. Challenge the ranked. Build your record.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IGN or PUBG UID..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm placeholder-secondary/50 focus:outline-none focus:border-frost-50/30 focus:bg-frost-800/80 transition-all"
          />
        </div>

        {/* Platform filter tabs */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {platformOptions.map((p) => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-4 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider transition-all duration-300 border ${
                platform === p
                  ? 'bg-frost-50/10 border-frost-50/30 text-frost-100'
                  : 'border-frost-50/5 text-secondary hover:border-frost-50/15 hover:text-frost-100'
              }`}
            >
              {p}
            </button>
          ))}

          <div className="h-5 w-px bg-frost-50/10 mx-1" />

          {RANK_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setRankFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider transition-all duration-300 border ${
                rankFilter === f
                  ? 'bg-frost-50/10 border-frost-50/30 text-frost-100'
                  : 'border-frost-50/5 text-secondary hover:border-frost-50/15 hover:text-frost-100'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-secondary text-xs max-w-4xl mx-auto uppercase font-semibold tracking-wider">
          {players.length} player{players.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Players Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-72 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />
          ))}
        </div>
      ) : error ? (
        <EmptyState iconName="WifiOff" title="FAILED TO LOAD" message={error} />
      ) : players.length === 0 ? (
        <EmptyState
          iconName="UserX"
          title="NO PLAYERS FOUND"
          message={search ? `No players matching "${search}"` : 'No players registered yet on this platform.'}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
          {players.map((player, i) => (
            <motion.div
              key={player._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.2 }}
            >
              <PlayerCard player={player} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Players;
