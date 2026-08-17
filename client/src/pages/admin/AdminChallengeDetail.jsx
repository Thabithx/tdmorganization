import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Swords, CreditCard, Flame, CheckCircle, XCircle, Clock, AlertOctagon, ExternalLink } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, PlatformBadge, RankBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatAmount, formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const TIMELINE_STEPS = [
  'PENDING', 'ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED',
  'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED',
];

const INFO_ROW = ({ label, value, mono }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-frost-50/5 last:border-0">
    <span className="text-[#4A5D6E] text-xs font-heading font-semibold uppercase tracking-widest flex-shrink-0">{label}</span>
    <span className={`text-[#F4FBFF] text-xs text-right ${mono ? 'font-mono' : 'font-semibold'}`}>{value || '—'}</span>
  </div>
);

export default function AdminChallengeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Status actions
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAdminChallengeById(id);
      if (res.success) setData(res.data);
      else setError('Challenge not found.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleCancel = async () => {
    setCancelling(true);
    setActionError('');
    try {
      await adminService.updateChallengeStatus(id, 'CANCELLED', cancelReason);
      setCancelDialog(false);
      setCancelReason('');
      fetchData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to cancel.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-frost-800/20 animate-pulse border border-frost-50/5" />)}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <p className="text-red-400 font-heading text-sm uppercase">{error}</p>
      <Button variant="secondary" onClick={() => navigate('/admin/challenges')} size="sm">← Back</Button>
    </div>
  );

  const { challenge, payment, match } = data;
  const currentStep = TIMELINE_STEPS.indexOf(challenge.status);
  const canCancel = !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(challenge.status);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={() => navigate('/admin/challenges')}
          className="flex items-center gap-2 text-[#4A5D6E] hover:text-[#8BE3FF] text-xs font-heading font-semibold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Challenges
        </button>
        <div className="flex items-center gap-2">
          {match && (
            <Link to={`/admin/matches/${match._id}`}>
              <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> View Match
              </Button>
            </Link>
          )}
          {canCancel && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setCancelDialog(true)}
              className="flex items-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" /> Cancel Challenge
            </Button>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-frost-800/40 border border-frost-50/10 flex items-center justify-center flex-shrink-0">
          <Swords className="w-5 h-5 text-[#8BE3FF]/60" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-black text-[#F4FBFF] uppercase tracking-wider">
            {challenge.challengerId?.ign} <span className="text-[#4A5D6E] text-base font-normal">vs</span> {challenge.defenderId?.ign}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <PlatformBadge platform={challenge.platform} />
            <StatusBadge status={challenge.status} />
            <span className="text-[#8BE3FF] text-sm font-heading font-bold">{formatAmount(challenge.challengeAmount)}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60">
          <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Challenge Timeline</h3>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-1 overflow-x-auto pb-2">
            {TIMELINE_STEPS.map((step, idx) => {
              const isDone = idx < currentStep || challenge.status === step;
              const isCurrent = challenge.status === step;
              const isCancelled = challenge.status === 'CANCELLED' || challenge.status === 'REJECTED';
              return (
                <React.Fragment key={step}>
                  <div className={`flex-shrink-0 flex flex-col items-center gap-1`}>
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      isCancelled && isCurrent
                        ? 'border-red-500 bg-red-950/40'
                        : isCurrent
                        ? 'border-[#8BE3FF] bg-[#8BE3FF]/15 shadow-[0_0_12px_rgba(139,227,255,0.3)]'
                        : isDone
                        ? 'border-emerald-500/60 bg-emerald-950/30'
                        : 'border-frost-50/10 bg-transparent'
                    }`}>
                      {isDone && !isCurrent ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent && isCancelled ? (
                        <XCircle className="w-4 h-4 text-red-400" />
                      ) : isCurrent ? (
                        <Clock className="w-3.5 h-3.5 text-[#8BE3FF]" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-frost-50/10" />
                      )}
                    </div>
                    <span className={`text-[9px] font-heading font-bold uppercase whitespace-nowrap tracking-wide ${
                      isCurrent ? 'text-[#8BE3FF]' : isDone ? 'text-emerald-400/70' : 'text-[#2A3D4E]'
                    }`}>
                      {step.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <div className={`flex-1 min-w-4 h-px ${idx < currentStep ? 'bg-emerald-500/30' : 'bg-frost-50/5'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Challenger Info */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Challenger</h3>
            <Link to={`/admin/players/${challenge.challengerId?._id}`} className="text-[#8BE3FF] text-[10px] font-heading font-semibold uppercase hover:underline flex items-center gap-1">
              View <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            <INFO_ROW label="IGN" value={challenge.challengerId?.ign} />
            <INFO_ROW label="UID" value={challenge.challengerId?.pubgUid} mono />
            <INFO_ROW label="Platform" value={<PlatformBadge platform={challenge.challengerId?.platform} />} />
            <INFO_ROW label="Rank at Creation" value={challenge.challengerRankAtCreation ? `#${challenge.challengerRankAtCreation}` : 'Unranked'} />
            <INFO_ROW label="Created" value={formatDate(challenge.createdAt)} />
          </div>
        </Card>

        {/* Defender Info */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Defender</h3>
            <Link to={`/admin/players/${challenge.defenderId?._id}`} className="text-[#8BE3FF] text-[10px] font-heading font-semibold uppercase hover:underline flex items-center gap-1">
              View <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-5">
            <INFO_ROW label="IGN" value={challenge.defenderId?.ign} />
            <INFO_ROW label="UID" value={challenge.defenderId?.pubgUid} mono />
            <INFO_ROW label="Platform" value={<PlatformBadge platform={challenge.defenderId?.platform} />} />
            <INFO_ROW label="Rank at Creation" value={challenge.defenderRankAtCreation ? `#${challenge.defenderRankAtCreation}` : 'Unranked'} />
            <INFO_ROW label="Accepted" value={formatDate(challenge.acceptedAt)} />
          </div>
        </Card>

        {/* Financial */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#8BE3FF]/60" />
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Payment</h3>
          </div>
          <div className="p-5">
            {payment ? (
              <>
                <INFO_ROW label="Amount" value={formatAmount(payment.amount)} />
                <INFO_ROW label="Currency" value={payment.currency} />
                <INFO_ROW label="Status" value={<StatusBadge status={payment.status} />} />
                <INFO_ROW label="PayHere Order ID" value={payment.payhereOrderId} mono />
                <INFO_ROW label="Transaction ID" value={payment.payhereTransactionId} mono />
                <INFO_ROW label="Confirmed At" value={formatDate(payment.confirmedAt)} />
                <INFO_ROW label="Min Required" value={formatAmount(challenge.minimumRequiredAmount)} />
              </>
            ) : (
              <p className="text-[#2A3D4E] text-xs italic">No payment record yet.</p>
            )}
          </div>
        </Card>

        {/* Match Link */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#8BE3FF]/60" />
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Match</h3>
          </div>
          <div className="p-5">
            {match ? (
              <>
                <INFO_ROW label="Match Status" value={<StatusBadge status={match.resultStatus} />} />
                <INFO_ROW label="Result" value={match.result?.replace(/_/g, ' ') || 'Pending'} />
                <INFO_ROW label="Winner" value={match.winnerId?.ign || '—'} />
                <INFO_ROW label="Loser" value={match.loserId?.ign || '—'} />
                <INFO_ROW label="Verified By" value={match.verifiedBy?.username || '—'} />
                <INFO_ROW label="Completed" value={formatDate(match.matchCompletedAt)} />
                <div className="mt-4">
                  <Link to={`/admin/matches/${match._id}`}>
                    <Button variant="secondary" size="sm" className="w-full flex items-center justify-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" /> Open Match Detail
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-[#2A3D4E] text-xs italic">No match record yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Cancel Modal */}
      <Modal isOpen={cancelDialog} onClose={() => setCancelDialog(false)} title="CANCEL CHALLENGE" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/15">
            <p className="text-red-300 text-sm">
              Cancelling <span className="text-[#F4FBFF] font-bold">{challenge.challengerId?.ign} vs {challenge.defenderId?.ign}</span> is irreversible.
            </p>
          </div>
          <div>
            <label className="text-xs font-heading font-semibold text-[#4A5D6E] uppercase tracking-widest block mb-1">Reason</label>
            <input
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            />
          </div>
          {actionError && <p className="text-red-400 text-xs">{actionError}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCancelDialog(false)} className="flex-1">CANCEL</Button>
            <Button variant="danger" onClick={handleCancel} isLoading={cancelling} className="flex-1">CONFIRM CANCEL</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
