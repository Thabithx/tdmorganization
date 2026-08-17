import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Swords, Trophy, Users, Search, Flame, PlayCircle, ShieldCheck } from 'lucide-react';
import FrostParticles from '../components/frost/FrostParticles';
import PlatformTabs from '../components/leaderboard/PlatformTabs';
import TopThreeCards from '../components/leaderboard/TopThreeCards';
import RankingRow from '../components/leaderboard/RankingRow';
import LeaderboardSkeleton from '../components/leaderboard/LeaderboardSkeleton';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatAmount, formatDate } from '../utils/formatters';
import * as rankingService from '../services/ranking.service';
import * as matchService from '../services/match.service';
import useAuth from '../hooks/useAuth';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [platform, setPlatform] = useState('MOBILE');
  const [leaderboard, setLeaderboard] = useState([]);
  const [latestMatches, setLatestMatches] = useState([]);
  const [loadingRank, setLoadingRank] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingRank(true);
      try {
        const res = await rankingService.getLeaderboard(platform);
        if (res.success) {
          setLeaderboard(res.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRank(false);
      }
    };
    fetchLeaderboard();
  }, [platform]);

  useEffect(() => {
    const fetchLatestMatches = async () => {
      try {
        const res = await matchService.getMatches({ status: 'COMPLETED' });
        if (res.success) {
          setLatestMatches(res.data.slice(0, 5));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMatches(false);
      }
    };
    fetchLatestMatches();
  }, []);

  const rank1 = leaderboard.find(r => r.rank === 1);
  const rank2 = leaderboard.find(r => r.rank === 2);
  const rank3 = leaderboard.find(r => r.rank === 3);
  const ranks4to10 = leaderboard.filter(r => r.rank >= 4 && r.rank <= 10);

  return (
    <div className="relative w-full space-y-20 overflow-hidden">
      {/* 1. HERO SECTION */}
      <section className="relative flex flex-col items-center text-center py-20 px-4 md:py-28 overflow-hidden rounded-2xl glass-panel border-frost-50/10">
        <FrostParticles />

        <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
          {/* Logo preview */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-frost-50/10 bg-frost-800/40 text-frost-50 text-xs font-semibold tracking-widest uppercase">
            <Flame className="w-3.5 h-3.5" />
            <span>ASIAN TDM COMPETITIVE NETWORK</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-heading font-extrabold tracking-tight text-[#F4FBFF] leading-tight">
            THINK YOU'RE BETTER?<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-frost-50 to-[#58c5f2] drop-shadow-[0_0_15px_rgba(139,223,255,0.4)]">
              PROVE IT.
            </span>
          </h1>

          <p className="text-secondary text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Challenge ranked TDM players, stake your claim, and fight your way to the top. Only the Top 10 are officially recognized. The rest is UNRANKED.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                const el = document.getElementById('leaderboard-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center space-x-2 w-full sm:w-auto"
            >
              <Trophy className="w-5 h-5" />
              <span>VIEW RANKINGS</span>
            </Button>
            {isAuthenticated ? (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/challenges')}
                className="w-full sm:w-auto"
              >
                VIEW MY CHALLENGES
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto"
              >
                JOIN THE ARENA
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* 2. LEADERBOARD PREVIEW */}
      <section id="leaderboard-section" className="space-y-8 scroll-mt-20">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-heading font-bold text-[#F4FBFF] tracking-wider uppercase">
            THE TOP 10 LEADERBOARD
          </h2>
          <p className="text-secondary text-sm max-w-md mx-auto">
            There is only one way up. Find your platform and challenge the elite.
          </p>
        </div>

        <PlatformTabs activePlatform={platform} onChange={setPlatform} />

        {loadingRank ? (
          <LeaderboardSkeleton />
        ) : (
          <div className="space-y-12">
            {/* Top 3 featured */}
            <TopThreeCards rank1={rank1} rank2={rank2} rank3={rank3} />

            {/* Ranks 4-10 vertical list */}
            <div className="w-full max-w-4xl mx-auto space-y-3">
              {ranks4to10.map((rDoc) => (
                <RankingRow key={rDoc._id} rankDoc={rDoc} />
              ))}
            </div>

            <div className="text-center">
              <Button
                variant="secondary"
                size="md"
                onClick={() => navigate('/rankings')}
              >
                VIEW FULL RANKINGS
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-heading font-bold text-[#F4FBFF] tracking-wider uppercase">
            HOW IT WORKS
          </h2>
          <p className="text-secondary text-sm">
            Three simple steps to build your competitive reputation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Step 1 */}
          <Card variant="default" className="p-8 text-center border-frost-50/5 relative">
            <span className="absolute top-4 left-4 font-heading text-xl font-bold text-frost-50/20">01</span>
            <div className="w-12 h-12 rounded-full bg-frost-800/60 flex items-center justify-center text-frost-50 mx-auto mb-4 border border-frost-50/10">
              <Search className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-frost-100 uppercase tracking-wider mb-2">
              FIND
            </h4>
            <p className="text-secondary text-xs leading-relaxed">
              Browse the official platform leaderboards or the player directory to find a target.
            </p>
          </Card>

          {/* Step 2 */}
          <Card variant="default" className="p-8 text-center border-frost-50/5 relative">
            <span className="absolute top-4 left-4 font-heading text-xl font-bold text-frost-50/20">02</span>
            <div className="w-12 h-12 rounded-full bg-frost-800/60 flex items-center justify-center text-frost-50 mx-auto mb-4 border border-frost-50/10">
              <Swords className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-frost-100 uppercase tracking-wider mb-2">
              CHALLENGE
            </h4>
            <p className="text-secondary text-xs leading-relaxed">
              Choose your challenge amount (Rs. 500+ for #10-#6, Rs. 900+ for #5-#1). Pay once they accept.
            </p>
          </Card>

          {/* Step 3 */}
          <Card variant="default" className="p-8 text-center border-frost-50/5 relative">
            <span className="absolute top-4 left-4 font-heading text-xl font-bold text-frost-50/20">03</span>
            <div className="w-12 h-12 rounded-full bg-frost-800/60 flex items-center justify-center text-frost-50 mx-auto mb-4 border border-frost-50/10">
              <PlayCircle className="w-5 h-5" />
            </div>
            <h4 className="font-heading font-bold text-base text-frost-100 uppercase tracking-wider mb-2">
              PROVE
            </h4>
            <p className="text-secondary text-xs leading-relaxed">
              Play the TDM lobby. Upload evidence. If you win, take their rank. Your victories remain permanent.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. LATEST VERIFIED RESULTS */}
      <section className="space-y-8 max-w-4xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-heading font-bold text-[#F4FBFF] tracking-wider uppercase">
            LATEST RESULTS
          </h2>
          <p className="text-secondary text-sm">
            Recent competitive results verified by FROST Administration.
          </p>
        </div>

        {loadingMatches ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-frost-800/50 rounded-xl" />
            <div className="h-16 bg-frost-800/50 rounded-xl" />
          </div>
        ) : latestMatches.length === 0 ? (
          <Card variant="default" className="p-8 text-center border-frost-50/5 text-secondary text-sm">
            No completed matches logged yet. Be the first to compete!
          </Card>
        ) : (
          <div className="space-y-4">
            {latestMatches.map((match) => {
              const challenger = match.challengerId;
              const defender = match.defenderId;
              
              return (
                <Card
                  key={match._id}
                  variant="default"
                  className="px-6 py-4 border-frost-50/5 flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0"
                >
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="font-heading font-bold text-[#F4FBFF] uppercase">{challenger?.ign}</span>
                    <span className="text-secondary text-xs">({match.challengerRankAtMatch ? `#${match.challengerRankAtMatch}` : 'UNRANKED'})</span>
                    <span className="text-frost-50 font-bold font-heading text-xs">defeated</span>
                    <span className="font-heading font-bold text-[#F4FBFF] uppercase">{defender?.ign}</span>
                    <span className="text-secondary text-xs">({match.defenderRankAtMatch ? `#${match.defenderRankAtMatch}` : 'UNRANKED'})</span>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-heading text-xs font-bold text-frost-50 uppercase bg-frost-800/80 px-2 py-0.5 rounded border border-frost-50/10">
                      {formatAmount(match.challengeAmount)}
                    </span>
                    <span className="text-secondary/50 text-[10px] uppercase font-semibold">
                      {formatDate(match.matchCompletedAt)}
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
