import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, Trophy, Target, Flame, ChevronRight, Shield, Gamepad2, Camera, Tv, FileText, Zap, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PlayerAvatar from '../components/player/PlayerAvatar';
import MatchCard from '../components/match/MatchCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { RankBadge, PlatformBadge } from '../components/ui/Badge';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import EmptyState from '../components/ui/EmptyState';
import useAuth from '../hooks/useAuth';
import * as playerService from '../services/player.service';
import { formatDate, formatAmount } from '../utils/formatters';

const TABS = ['OVERVIEW', 'MATCH HISTORY', 'PLAYERS DEFEATED'];

const StatBox = ({ label, value, highlight }) => (
  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-frost-800/40 border border-frost-50/5">
    <span className={`font-heading text-2xl font-extrabold tracking-tight ${highlight ? 'text-frost-50 drop-shadow-[0_0_8px_rgba(139,223,255,0.3)]' : 'text-[#F4FBFF]'}`}>
      {value}
    </span>
    <span className="text-secondary text-[10px] uppercase font-semibold tracking-widest mt-1">{label}</span>
  </div>
);

const PlayerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, profile: myProfile } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [matchFilter, setMatchFilter] = useState('ALL');

  useEffect(() => {
    const fetchPlayer = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await playerService.getPlayerById(id);
        if (res.success) setData(res.data);
        else setError('Player not found.');
      } catch {
        setError('Failed to load player profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [id]);

  const isOwnProfile = myProfile && myProfile._id === id;
  const samePlatform = myProfile && data?.profile?.platform === myProfile.platform;
  const canChallenge = isAuthenticated && !isOwnProfile && data?.currentRank !== null;

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      <div className="h-40 bg-frost-800/40 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-frost-800/40 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto py-16">
      <EmptyState iconName="UserX" title="PLAYER NOT FOUND" message={error} />
    </div>
  );

  const { profile, currentRank, stats, rankHistory } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-8">
      {/* Hero Banner */}
      <Card variant="elevated" className="relative overflow-hidden border-frost-50/10">
        {/* BG glow based on rank */}
        {currentRank === 1 && <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/5 to-transparent pointer-events-none" />}
        {currentRank === 2 && <div className="absolute inset-0 bg-gradient-to-br from-[#C0C0C0]/5 to-transparent pointer-events-none" />}
        {currentRank === 3 && <div className="absolute inset-0 bg-gradient-to-br from-[#CD7F32]/5 to-transparent pointer-events-none" />}

        <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <PlayerAvatar profile={{ ...profile, currentRank }} size="xl" objectPosition={profile.avatarPosition} />
          </div>

          {/* Info */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left flex-1 space-y-3">
            <div className="flex items-center space-x-3 flex-wrap justify-center sm:justify-start">
              <RankBadge rank={currentRank} size="md" />
              <PlatformBadge platform={profile.platform} />
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-[#F4FBFF] uppercase tracking-wider">
              {profile.ign}
            </h1>
            <p className="text-secondary text-xs uppercase tracking-widest font-semibold">
              UID: {profile.pubgUid}
            </p>

            {profile.bio && (
              <p className="text-secondary/80 text-sm max-w-md italic">
                "{profile.bio}"
              </p>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-secondary/60">
              {profile.yearsPlaying > 0 && (
                <span className="flex items-center space-x-1"><Gamepad2 className="w-3.5 h-3.5 text-frost-50" /> <span><strong className="text-frost-50">{profile.yearsPlaying}</strong> years playing</span></span>
              )}
              {profile.lookingFor && (
                <span className="flex items-center space-x-1"><Target className="w-3.5 h-3.5 text-frost-50" /> <span>Looking for: <strong className="text-frost-50">{profile.lookingFor}</strong></span></span>
              )}
            </div>

            <div className="flex items-center space-x-4 text-xs pt-1">
              {profile.instagram && (
                <a
                  href={`https://instagram.com/${profile.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-frost-50 hover:text-white transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-frost-50" />
                  <span>Instagram: <span className="underline">@{profile.instagram}</span></span>
                </a>
              )}
              {profile.tiktok && (
                <a
                  href={`https://tiktok.com/@${profile.tiktok}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 text-frost-50 hover:text-white transition-colors"
                >
                  <Tv className="w-3.5 h-3.5 text-frost-50" />
                  <span>TikTok: <span className="underline">@{profile.tiktok}</span></span>
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 pt-2">
              {canChallenge && samePlatform && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate(`/challenge/${profile._id}`)}
                  className="flex items-center space-x-2"
                >
                  <Swords className="w-4 h-4" />
                  <span>CHALLENGE PLAYER</span>
                </Button>
              )}
              {canChallenge && !samePlatform && (
                <div className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-secondary/20 text-secondary text-xs font-semibold">
                  <Shield className="w-4 h-4" />
                  <span>DIFFERENT PLATFORM — CANNOT CHALLENGE</span>
                </div>
              )}
              {isOwnProfile && (
                <Button variant="secondary" size="md" onClick={() => navigate('/profile')}>
                  EDIT PROFILE
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Wins" value={stats?.wins ?? 0} highlight />
        <StatBox label="Losses" value={stats?.losses ?? 0} />
        <StatBox label="Win Rate" value={stats ? `${stats.winRate}%` : '0%'} highlight />
        <StatBox label="Matches" value={stats?.total ?? 0} />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-frost-50/10 space-x-6">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 text-xs font-heading font-semibold uppercase tracking-widest transition-all duration-300 border-b-2 ${
              activeTab === tab
                ? 'text-frost-50 border-frost-50'
                : 'text-secondary border-transparent hover:text-frost-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8">
              {/* Profile Details */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-bold text-secondary uppercase tracking-widest flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-frost-50" />
                  <span>Profile Details</span>
                </h3>
                <Card variant="default" className="p-5 border-frost-50/5 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                  <div className="flex justify-between py-2.5 border-b border-frost-50/5">
                    <span className="text-secondary text-xs uppercase tracking-wider font-semibold">Gaming Platform</span>
                    <PlatformBadge platform={profile.platform} />
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-frost-50/5">
                    <span className="text-secondary text-xs uppercase tracking-wider font-semibold">PUBG UID</span>
                    <span className="font-mono text-[#F4FBFF] text-xs">{profile.pubgUid}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-frost-50/5">
                    <span className="text-secondary text-xs uppercase tracking-wider font-semibold">Years Playing</span>
                    <span className="font-heading font-bold text-[#F4FBFF] text-xs">{profile.yearsPlaying || 0} years</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-frost-50/5">
                    <span className="text-secondary text-xs uppercase tracking-wider font-semibold">Looking For</span>
                    <span className="font-heading font-bold text-frost-50 text-xs uppercase tracking-wider">{profile.lookingFor || 'Not Specified'}</span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-frost-50/5">
                    <span className="text-secondary text-xs uppercase tracking-wider font-semibold">Instagram</span>
                    <span className="font-heading font-bold text-[#F4FBFF] text-xs">
                      {profile.instagram ? (
                        <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                          @{profile.instagram}
                        </a>
                      ) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-frost-50/5">
                    <span className="text-secondary text-xs uppercase tracking-wider font-semibold">TikTok</span>
                    <span className="font-heading font-bold text-[#F4FBFF] text-xs">
                      {profile.tiktok ? (
                        <a href={`https://tiktok.com/@${profile.tiktok}`} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">
                          @{profile.tiktok}
                        </a>
                      ) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2.5 border-b border-frost-50/5 sm:col-span-2">
                    <span className="text-secondary text-xs uppercase tracking-wider font-semibold">Member Since</span>
                    <span className="font-heading font-bold text-[#F4FBFF] text-xs">{formatDate(profile.createdAt)}</span>
                  </div>
                </Card>
              </div>

              {/* Controls Layout */}
              {profile.controlsLayout && (
                <div className="space-y-3">
                  <h3 className="font-heading text-sm font-bold text-secondary uppercase tracking-widest flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-frost-50" />
                    <span>Controls Layout</span>
                  </h3>
                  <Card variant="default" className="p-5 border-frost-50/5 max-w-lg overflow-hidden bg-[#0B101A] flex items-center justify-center">
                    <img src={profile.controlsLayout} alt={`${profile.ign}'s Controls Layout`} className="w-full h-auto object-contain max-h-64 rounded-lg" />
                  </Card>
                </div>
              )}

              {/* Notable Victories */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-bold text-secondary uppercase tracking-widest flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-frost-50" />
                  <span>Notable Victories</span>
                </h3>
                {stats?.notableVictories?.length > 0 ? (
                  <div className="space-y-2">
                    {stats.notableVictories.slice(0, 5).map((v, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-frost-800/30 border border-frost-50/5 hover:border-frost-50/10 cursor-pointer"
                        onClick={() => navigate(`/players/${v.opponent?._id}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <RankBadge rank={v.rank} size="sm" />
                          <span className="font-heading font-bold text-sm text-[#F4FBFF] uppercase">{v.opponent?.ign}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-frost-50 text-xs font-semibold">{formatAmount(v.amount)}</span>
                          <ChevronRight className="w-4 h-4 text-secondary/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-sm">No notable victories yet.</p>
                )}
              </div>

              {/* Players Defeated preview */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-bold text-secondary uppercase tracking-widest flex items-center space-x-2">
                  <Crosshair className="w-4 h-4 text-frost-50" />
                  <span>Players Defeated</span>
                </h3>
                {stats?.playersDefeated?.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {stats.playersDefeated.slice(0, 6).map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-4 py-3 rounded-lg bg-frost-800/30 border border-frost-50/5 cursor-pointer hover:border-frost-50/10"
                        onClick={() => navigate(`/players/${p.profile?._id}`)}
                      >
                        <span className="font-heading font-bold text-xs text-[#F4FBFF] uppercase truncate">{p.profile?.ign}</span>
                        <span className="ml-2 flex-shrink-0 font-heading text-frost-50 text-sm font-extrabold">{p.count}×</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-sm">No players defeated yet.</p>
                )}
              </div>

              {/* Recent Matches */}
              <div className="space-y-3">
                <h3 className="font-heading text-sm font-bold text-secondary uppercase tracking-widest flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-frost-50" />
                  <span>Recent Matches</span>
                </h3>
                {stats?.recentMatches?.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentMatches.slice(0, 5).map((m, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-3 rounded-lg bg-frost-800/30 border border-frost-50/5">
                        <div className="flex items-center space-x-3">
                          <span className={`font-heading text-xs font-extrabold uppercase px-2 py-0.5 rounded ${m.result === 'WIN' ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' : 'bg-red-950/40 border border-red-500/30 text-red-300'}`}>
                            {m.result}
                          </span>
                          <span className="font-heading text-sm font-bold text-[#F4FBFF] uppercase">{m.opponent?.ign}</span>
                          {m.opponentRankAtMatch && <RankBadge rank={m.opponentRankAtMatch} size="sm" />}
                        </div>
                        <span className="text-secondary text-xs">{formatDate(m.date)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-secondary text-sm">No matches played yet.</p>
                )}
              </div>

              {/* Rank History */}
              {rankHistory?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-heading text-sm font-bold text-secondary uppercase tracking-widest">📈 Rank History</h3>
                  <div className="space-y-2">
                    {rankHistory.slice(0, 8).map((rh, i) => (
                      <div key={i} className="flex items-center justify-between px-4 py-2 rounded-lg bg-frost-800/20 border border-frost-50/5 text-xs">
                        <span className="text-secondary uppercase tracking-wider font-semibold">{rh.reason.replace('_', ' ')}</span>
                        <span className="font-heading text-frost-100 font-bold">
                          {rh.previousRank ? `#${rh.previousRank}` : 'UNRANKED'} → {rh.newRank ? `#${rh.newRank}` : 'UNRANKED'}
                        </span>
                        <span className="text-secondary/50">{formatDate(rh.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'MATCH HISTORY' && (
            <div className="space-y-4">
              <div className="flex space-x-2">
                {['ALL', 'WINS', 'LOSSES'].map(f => (
                  <button
                    key={f}
                    onClick={() => setMatchFilter(f)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase tracking-wider border transition-all ${
                      matchFilter === f
                        ? 'bg-frost-50/10 border-frost-50/30 text-frost-100'
                        : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              {stats?.recentMatches?.length > 0 ? (
                stats.recentMatches
                  .filter(m => matchFilter === 'ALL' || m.result === matchFilter.slice(0, -1))
                  .map((m, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl bg-frost-800/30 border border-frost-50/5">
                      <div className="flex items-center space-x-3">
                        <span className={`font-heading text-xs font-extrabold uppercase px-2 py-0.5 rounded border ${m.result === 'WIN' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-red-950/40 border-red-500/30 text-red-300'}`}>
                          {m.result}
                        </span>
                        <div>
                          <span className="font-heading text-sm font-bold text-[#F4FBFF] uppercase">vs {m.opponent?.ign}</span>
                          {m.opponentRankAtMatch && (
                            <span className="ml-2 text-secondary text-xs">(#{m.opponentRankAtMatch})</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-frost-50 text-xs font-semibold font-heading">{formatAmount(m.amount)}</p>
                        <p className="text-secondary/50 text-[10px] mt-0.5">{formatDate(m.date)}</p>
                      </div>
                    </div>
                  ))
              ) : (
                <EmptyState iconName="Flame" title="NO MATCHES" message="This player has not competed yet." />
              )}
            </div>
          )}

          {activeTab === 'PLAYERS DEFEATED' && (
            <div className="space-y-3">
              {stats?.playersDefeated?.length > 0 ? (
                stats.playersDefeated.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-5 py-4 rounded-xl bg-frost-800/30 border border-frost-50/5 cursor-pointer hover:border-frost-50/10"
                    onClick={() => navigate(`/players/${p.profile?._id}`)}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-heading text-secondary/50 text-sm font-bold w-6 text-right">{i + 1}.</span>
                      <span className="font-heading font-bold text-base text-[#F4FBFF] uppercase tracking-wider">{p.profile?.ign}</span>
                      {p.lastRank && <RankBadge rank={p.lastRank} size="sm" />}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-heading text-2xl font-extrabold text-frost-50 drop-shadow-[0_0_8px_rgba(139,223,255,0.3)]">{p.count}×</span>
                      <ChevronRight className="w-4 h-4 text-secondary/30" />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState iconName="Target" title="NO DEFEATS" message="This player has not defeated any opponents yet." />
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default PlayerProfile;
