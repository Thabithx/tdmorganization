import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Swords, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { RankBadge, PlatformBadge } from '../components/ui/Badge';
import PlayerAvatar from '../components/player/PlayerAvatar';
import LoadingSkeleton from '../components/ui/LoadingSkeleton';
import useAuth from '../hooks/useAuth';
import * as playerService from '../services/player.service';
import * as challengeService from '../services/challenge.service';
import { formatAmount } from '../utils/formatters';
import { validateChallengeAmount, getMinimumChallengeAmount } from '../utils/validators';

const ChallengePage = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const { profile: myProfile, isAuthenticated } = useAuth();

  const [opponent, setOpponent] = useState(null);
  const [opponentRank, setOpponentRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState(1); // 1 = configure, 2 = confirm, 3 = success
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchOpponent = async () => {
      try {
        const res = await playerService.getPlayerById(playerId);
        if (res.success) {
          setOpponent(res.data.profile);
          setOpponentRank(res.data.currentRank);
          const min = getMinimumChallengeAmount(res.data.currentRank);
          setAmount(String(min));
        } else {
          setError('Player not found.');
        }
      } catch {
        setError('Failed to load opponent profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchOpponent();
  }, [playerId]);

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const samePlatform = myProfile && opponent && myProfile.platform === opponent.platform;
  const isOwnProfile = myProfile && myProfile._id === playerId;
  const minimumAmount = getMinimumChallengeAmount(opponentRank);
  const amountNum = parseFloat(amount) || 0;
  const validation = validateChallengeAmount(amountNum, opponentRank);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await challengeService.createChallenge(opponent._id, amountNum);
      if (res.success) {
        setStep(3);
      } else {
        setSubmitError(res.message || 'Failed to send challenge.');
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to send challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-lg mx-auto py-10 space-y-4">
      <div className="h-10 bg-frost-800/40 rounded-lg animate-pulse" />
      <div className="h-64 bg-frost-800/40 rounded-2xl animate-pulse" />
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <p className="text-red-400">{error}</p>
      <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mt-4">GO BACK</Button>
    </div>
  );

  if (isOwnProfile) return (
    <div className="max-w-lg mx-auto py-16 text-center">
      <p className="text-secondary">You cannot challenge yourself.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="mt-4">GO BACK</Button>
    </div>
  );

  if (!samePlatform) return (
    <div className="max-w-lg mx-auto py-16">
      <Card variant="default" className="p-8 text-center border-red-500/20">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h2 className="font-heading text-lg font-bold text-red-200 uppercase mb-2">PLATFORM MISMATCH</h2>
        <p className="text-secondary text-sm mb-6">
          You play on <strong className="text-frost-100">{myProfile?.platform}</strong> but {opponent?.ign} plays on{' '}
          <strong className="text-frost-100">{opponent?.platform}</strong>. Cross-platform challenges are not allowed.
        </p>
        <Button variant="secondary" size="md" onClick={() => navigate(-1)}>GO BACK</Button>
      </Card>
    </div>
  );

  if (opponentRank === null) return (
    <div className="max-w-lg mx-auto py-16">
      <Card variant="default" className="p-8 text-center border-frost-50/10">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
        <h2 className="font-heading text-lg font-bold text-amber-200 uppercase mb-2">PLAYER UNRANKED</h2>
        <p className="text-secondary text-sm mb-6">
          {opponent?.ign} is not currently ranked. You can only challenge ranked players.
        </p>
        <Button variant="secondary" size="md" onClick={() => navigate(-1)}>GO BACK</Button>
      </Card>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto py-6 space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-secondary hover:text-frost-50 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      {step === 3 ? (
        <Card variant="elevated" className="p-10 text-center border-frost-50/15 space-y-4">
          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto drop-shadow-[0_0_12px_rgba(52,211,153,0.4)]" />
          <h2 className="font-heading text-2xl font-extrabold text-[#F4FBFF] uppercase tracking-wider">CHALLENGE SENT!</h2>
          <p className="text-secondary text-sm max-w-xs mx-auto">
            Your challenge to <strong className="text-frost-100">{opponent.ign}</strong> for{' '}
            <strong className="text-frost-50">{formatAmount(amountNum)}</strong> has been sent. You'll be notified when they respond.
          </p>
          <div className="flex space-x-3 justify-center pt-2">
            <Button variant="secondary" size="md" onClick={() => navigate('/challenges')}>
              VIEW MY CHALLENGES
            </Button>
            <Button variant="primary" size="md" onClick={() => navigate('/rankings')}>
              VIEW RANKINGS
            </Button>
          </div>
        </Card>
      ) : (
        <Card variant="elevated" className="overflow-hidden border-frost-50/15">
          {/* Header */}
          <div className="px-6 py-5 bg-frost-800/60 border-b border-frost-50/10 flex items-center space-x-3">
            <Swords className="w-5 h-5 text-frost-50" />
            <h2 className="font-heading text-base font-bold text-[#F4FBFF] uppercase tracking-widest">
              {step === 1 ? 'SEND CHALLENGE' : 'CONFIRM CHALLENGE'}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Opponent Info */}
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-frost-900/60 border border-frost-50/5">
              <PlayerAvatar profile={{ ...opponent, currentRank: opponentRank }} size="md" objectPosition={opponent.avatarPosition} />
              <div>
                <h3 className="font-heading font-bold text-lg text-[#F4FBFF] uppercase tracking-wider">{opponent.ign}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <RankBadge rank={opponentRank} size="sm" />
                  <PlatformBadge platform={opponent.platform} />
                </div>
              </div>
            </div>

            {step === 1 ? (
              <>
                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">
                    Challenge Amount (LKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-heading font-bold text-frost-50/60 text-sm">Rs.</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      min={minimumAmount}
                      step={50}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-lg font-heading font-bold focus:outline-none focus:border-frost-50/30 transition-all"
                    />
                  </div>
                  <p className="text-xs text-secondary">
                    Minimum for <span className="text-frost-50 font-semibold">#{opponentRank}</span>:{' '}
                    <span className="text-frost-50 font-semibold">{formatAmount(minimumAmount)}</span>
                  </p>
                  {amountNum > 0 && !validation.isValid && (
                    <p className="text-red-400 text-xs flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{validation.message}</span>
                    </p>
                  )}
                </div>

                <div className="bg-frost-900/60 rounded-xl p-4 border border-frost-50/5 text-xs text-secondary space-y-1.5">
                  <p>• Payment is only required <strong className="text-frost-100">after</strong> your opponent accepts.</p>
                  <p>• If rejected, no payment is taken.</p>
                  <p>• The amount is fixed after challenge creation.</p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setStep(2)}
                  disabled={!validation.isValid}
                  className="w-full"
                >
                  REVIEW CHALLENGE
                </Button>
              </>
            ) : (
              <>
                {/* Confirmation Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 border-b border-frost-50/5">
                    <span className="text-secondary text-sm">Opponent</span>
                    <span className="font-heading font-bold text-[#F4FBFF] uppercase">{opponent.ign}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-frost-50/5">
                    <span className="text-secondary text-sm">Platform</span>
                    <PlatformBadge platform={opponent.platform} />
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-frost-50/5">
                    <span className="text-secondary text-sm">Opponent Rank</span>
                    <RankBadge rank={opponentRank} size="sm" />
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-frost-50/5">
                    <span className="text-secondary text-sm">Challenge Amount</span>
                    <span className="font-heading text-lg font-extrabold text-frost-50">{formatAmount(amountNum)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-secondary text-sm">Payment</span>
                    <span className="text-emerald-400 text-xs font-semibold uppercase">Only if accepted</span>
                  </div>
                </div>

                {submitError && (
                  <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="flex space-x-3">
                  <Button variant="secondary" size="md" onClick={() => setStep(1)} className="flex-1">
                    BACK
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleSubmit}
                    isLoading={submitting}
                    className="flex-1 flex items-center space-x-2"
                  >
                    <Swords className="w-4 h-4" />
                    <span>CONFIRM CHALLENGE</span>
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ChallengePage;
