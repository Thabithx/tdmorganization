import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Flame, Image, Link2, FilePlus, ClipboardCheck,
  AlertOctagon, ShieldCheck, RotateCcw, ExternalLink, Upload, Eye
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, PlatformBadge, RankBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatAmount, formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const INFO_ROW = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2.5 border-b border-frost-50/5 last:border-0">
    <span className="text-[#4A5D6E] text-xs font-heading font-semibold uppercase tracking-widest flex-shrink-0">{label}</span>
    <span className="text-[#F4FBFF] text-xs text-right font-semibold">{value || '—'}</span>
  </div>
);

export default function AdminMatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Result confirmation
  const [resultModal, setResultModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultError, setResultError] = useState('');

  // Result correction
  const [correctModal, setCorrectModal] = useState(false);
  const [correctResult, setCorrectResult] = useState('');
  const [correctReason, setCorrectReason] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [correctError, setCorrectError] = useState('');

  // Dispute
  const [disputeConfirm, setDisputeConfirm] = useState(false);
  const [disputing, setDisputing] = useState(false);

  // Evidence
  const [evidenceModal, setEvidenceModal] = useState(false);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [addingEvidence, setAddingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAdminMatchById(id);
      if (res.success) setData(res.data);
      else setError('Match not found.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load match.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleConfirmResult = async () => {
    if (!selectedResult) return;
    setSubmitting(true);
    setResultError('');
    try {
      const res = await adminService.confirmMatchResult(id, selectedResult);
      if (res.data?.requiresAdminResolution) {
        setResultError('⚠ Shared rank conflict. Manual ranking resolution required. Go to Rankings to resolve.');
      } else {
        setResultModal(false);
        setSelectedResult('');
        fetchData();
      }
    } catch (err) {
      setResultError(err.response?.data?.message || 'Failed to confirm result.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCorrectResult = async () => {
    if (!correctResult || !correctReason) return;
    setCorrecting(true);
    setCorrectError('');
    try {
      await adminService.correctMatchResult(id, correctResult, correctReason);
      setCorrectModal(false);
      setCorrectResult('');
      setCorrectReason('');
      fetchData();
    } catch (err) {
      setCorrectError(err.response?.data?.message || 'Failed to correct result.');
    } finally {
      setCorrecting(false);
    }
  };

  const handleDispute = async () => {
    setDisputing(true);
    try {
      await adminService.updateMatchStatus(id, 'DISPUTED');
      setDisputeConfirm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark disputed.');
    } finally {
      setDisputing(false);
    }
  };

  const handleAddEvidence = async () => {
    if (!evidenceUrl.trim()) return;
    setAddingEvidence(true);
    setEvidenceError('');
    try {
      await adminService.addMatchEvidence(id, { type: 'URL', url: evidenceUrl.trim(), notes: evidenceNotes.trim() });
      setEvidenceModal(false);
      setEvidenceUrl('');
      setEvidenceNotes('');
      fetchData();
    } catch (err) {
      setEvidenceError(err.response?.data?.message || 'Failed to add evidence.');
    } finally {
      setAddingEvidence(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-36 rounded-xl bg-frost-800/20 animate-pulse border border-frost-50/5" />)}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <p className="text-red-400 font-heading text-sm uppercase">{error}</p>
      <Button variant="secondary" onClick={() => navigate('/admin/matches')} size="sm">← Back</Button>
    </div>
  );

  const { match, challenge, payment } = data;
  const paymentConfirmed = payment?.status === 'CONFIRMED';
  const canConfirmResult = match.resultStatus === 'RESULT_PENDING' && paymentConfirmed;
  const canMarkDispute = !['COMPLETED', 'DISPUTED', 'CANCELLED'].includes(match.resultStatus);
  const canCorrect = match.resultStatus === 'COMPLETED';

  // Ranking impact preview helper
  const getRankImpact = (result) => {
    const cRank = match.challengerRankAtMatch;
    const dRank = match.defenderRankAtMatch;
    if (!result) return null;
    const challengerWins = result === 'CHALLENGER_WON';
    if (challengerWins) {
      if (cRank && dRank) {
        return { type: 'swap', challenger: { from: cRank, to: dRank }, defender: { from: dRank, to: cRank } };
      } else if (!cRank && dRank) {
        return { type: 'insertion', challenger: { from: null, to: dRank }, defender: { from: dRank, to: dRank + 1 } };
      }
    }
    return { type: 'no_change', message: 'No ranking movement for challenger loss.' };
  };

  const impact = getRankImpact(selectedResult || correctResult);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate('/admin/matches')}
          className="flex items-center gap-2 text-[#4A5D6E] hover:text-[#8BE3FF] text-xs font-heading font-semibold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Matches
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEvidenceModal(true)} className="flex items-center gap-1.5">
            <FilePlus className="w-3.5 h-3.5" /> Add Evidence
          </Button>
          {canMarkDispute && (
            <Button variant="danger" size="sm" onClick={() => setDisputeConfirm(true)} className="flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5" /> Mark Disputed
            </Button>
          )}
          {canConfirmResult && (
            <Button variant="primary" size="sm" onClick={() => { setSelectedResult(''); setResultError(''); setResultModal(true); }} className="flex items-center gap-1.5">
              <ClipboardCheck className="w-3.5 h-3.5" /> Declare Result
            </Button>
          )}
          {canCorrect && (
            <Button variant="warning" size="sm" onClick={() => { setCorrectResult(''); setCorrectReason(''); setCorrectError(''); setCorrectModal(true); }} className="flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Correct Result
            </Button>
          )}
        </div>
      </div>

      {/* Match Header */}
      <Card variant="default" className="border-frost-50/[0.06]">
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Flame className="w-5 h-5 text-[#8BE3FF]/50" />
              <h1 className="font-heading text-xl font-black text-[#F4FBFF] uppercase tracking-wider">
                {match.challengerId?.ign} <span className="text-[#4A5D6E] text-base font-normal">vs</span> {match.defenderId?.ign}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PlatformBadge platform={match.platform} />
              <span className={`text-xs font-heading font-semibold uppercase px-2 py-0.5 rounded border ${
                match.resultStatus === 'COMPLETED' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30'
                : match.resultStatus === 'DISPUTED' ? 'text-red-300 border-red-500/30 bg-red-950/30'
                : 'text-amber-300 border-amber-500/30 bg-amber-950/30'
              }`}>
                {match.resultStatus}
              </span>
              {match.winnerId && (
                <span className="text-emerald-400 text-xs font-heading font-bold uppercase">
                  → {match.winnerId?.ign} WON
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-heading text-2xl font-black text-[#8BE3FF]">{formatAmount(match.challengeAmount)}</p>
            <p className="text-[#4A5D6E] text-xs mt-0.5">{formatDate(match.createdAt)}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Challenger */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Challenger</h3>
            {match.winnerId?._id?.toString() === match.challengerId?._id?.toString() && (
              <span className="text-emerald-400 text-[10px] font-heading font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> WINNER
              </span>
            )}
          </div>
          <div className="p-5">
            <p className="font-heading text-lg font-black text-[#F4FBFF] uppercase mb-3">{match.challengerId?.ign}</p>
            <INFO_ROW label="UID" value={match.challengerId?.pubgUid} />
            <INFO_ROW label="Rank at Creation" value={match.challengerRankAtChallenge ? `#${match.challengerRankAtChallenge}` : 'Unranked'} />
            <INFO_ROW label="Rank at Match" value={match.challengerRankAtMatch ? `#${match.challengerRankAtMatch}` : 'Unranked'} />
            <div className="mt-3">
              <Link to={`/admin/players/${match.challengerId?._id}`} className="text-[#8BE3FF] text-[10px] font-heading font-semibold uppercase hover:underline flex items-center gap-1">
                View Player <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Defender */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Defender</h3>
            {match.winnerId?._id?.toString() === match.defenderId?._id?.toString() && (
              <span className="text-emerald-400 text-[10px] font-heading font-bold uppercase flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> WINNER
              </span>
            )}
          </div>
          <div className="p-5">
            <p className="font-heading text-lg font-black text-[#F4FBFF] uppercase mb-3">{match.defenderId?.ign}</p>
            <INFO_ROW label="UID" value={match.defenderId?.pubgUid} />
            <INFO_ROW label="Rank at Creation" value={match.defenderRankAtChallenge ? `#${match.defenderRankAtChallenge}` : 'Unranked'} />
            <INFO_ROW label="Rank at Match" value={match.defenderRankAtMatch ? `#${match.defenderRankAtMatch}` : 'Unranked'} />
            <div className="mt-3">
              <Link to={`/admin/players/${match.defenderId?._id}`} className="text-[#8BE3FF] text-[10px] font-heading font-semibold uppercase hover:underline flex items-center gap-1">
                View Player <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </Card>

        {/* Payment */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60">
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Payment</h3>
          </div>
          <div className="p-5">
            {payment ? (
              <>
                <INFO_ROW label="Status" value={<StatusBadge status={payment.status} />} />
                <INFO_ROW label="Amount" value={formatAmount(payment.amount)} />
                <INFO_ROW label="PayHere Order" value={payment.payhereOrderId} />
                <INFO_ROW label="Transaction ID" value={payment.payhereTransactionId} />
                <INFO_ROW label="Confirmed At" value={formatDate(payment.confirmedAt)} />
              </>
            ) : (
              <p className="text-[#2A3D4E] text-xs italic">No payment record.</p>
            )}
          </div>
        </Card>

        {/* Admin Notes */}
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60">
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Admin Notes</h3>
          </div>
          <div className="p-5">
            {match.adminNotes ? (
              <p className="text-[#8A9AAD] text-xs leading-relaxed whitespace-pre-wrap">{match.adminNotes}</p>
            ) : (
              <p className="text-[#2A3D4E] text-xs italic">No notes.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Evidence */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between">
          <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">
            Evidence ({match.evidence?.length || 0})
          </h3>
          <button
            onClick={() => setEvidenceModal(true)}
            className="text-[#8BE3FF] text-[10px] font-heading font-semibold uppercase hover:underline flex items-center gap-1"
          >
            <FilePlus className="w-3 h-3" /> Add
          </button>
        </div>
        <div className="p-5">
          {(!match.evidence || match.evidence.length === 0) ? (
            <p className="text-[#2A3D4E] text-xs italic">No evidence submitted.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {match.evidence.map((ev, i) => (
                <div key={i} className="p-3 rounded-lg bg-frost-800/20 border border-frost-50/5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {ev.type === 'IMAGE' ? <Image className="w-3.5 h-3.5 text-[#8BE3FF]/60" /> : <Link2 className="w-3.5 h-3.5 text-[#8BE3FF]/60" />}
                      <span className="text-[#4A5D6E] text-[10px] font-heading font-semibold uppercase">{ev.type}</span>
                    </div>
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-[#8BE3FF] hover:underline flex items-center gap-1 text-[10px] font-heading font-semibold uppercase">
                      <Eye className="w-3 h-3" /> View
                    </a>
                  </div>
                  {ev.notes && <p className="text-[#8A9AAD] text-xs">{ev.notes}</p>}
                  <p className="text-[#2A3D4E] text-[10px] mt-1">{formatDate(ev.uploadedAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* ── MODALS ── */}

      {/* Declare Result Modal */}
      <Modal isOpen={resultModal} onClose={() => setResultModal(false)} title="DECLARE MATCH RESULT" maxWidth="max-w-lg">
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-frost-900/60 border border-frost-50/5 text-center">
            <p className="font-heading font-bold text-lg text-[#F4FBFF] uppercase">
              {match.challengerId?.ign} <span className="text-[#4A5D6E] text-sm font-normal">vs</span> {match.defenderId?.ign}
            </p>
            <p className="text-[#4A5D6E] text-xs mt-1">
              Ranks: {match.challengerRankAtMatch ? `#${match.challengerRankAtMatch}` : 'Unranked'} vs {match.defenderRankAtMatch ? `#${match.defenderRankAtMatch}` : 'Unranked'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedResult('CHALLENGER_WON')}
              className={`py-4 px-3 rounded-xl text-sm font-heading font-bold uppercase border transition-all ${
                selectedResult === 'CHALLENGER_WON'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                  : 'border-frost-50/10 text-[#4A5D6E] hover:border-frost-50/20'
              }`}
            >
              {match.challengerId?.ign}<br />
              <span className="text-xs opacity-70">WON</span>
            </button>
            <button
              onClick={() => setSelectedResult('CHALLENGER_LOST')}
              className={`py-4 px-3 rounded-xl text-sm font-heading font-bold uppercase border transition-all ${
                selectedResult === 'CHALLENGER_LOST'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(52,211,153,0.1)]'
                  : 'border-frost-50/10 text-[#4A5D6E] hover:border-frost-50/20'
              }`}
            >
              {match.defenderId?.ign}<br />
              <span className="text-xs opacity-70">WON</span>
            </button>
          </div>

          {/* Ranking Impact Preview */}
          {selectedResult && impact && (
            <div className="p-4 rounded-xl bg-[#0A1520] border border-[#8BE3FF]/10">
              <p className="text-[#8BE3FF]/60 text-[10px] font-heading font-bold uppercase tracking-widest mb-3">Expected Ranking Impact</p>
              {impact.type === 'no_change' ? (
                <p className="text-[#4A5D6E] text-xs">{impact.message}</p>
              ) : impact.type === 'swap' ? (
                <div className="flex items-center gap-4 text-xs">
                  <div className="text-center">
                    <p className="text-[#4A5D6E] mb-1">Before</p>
                    <p className="text-[#F4FBFF] font-bold font-heading">#{ impact.challenger.from} {match.challengerId?.ign}</p>
                    <p className="text-[#F4FBFF] font-bold font-heading">#{impact.defender.from} {match.defenderId?.ign}</p>
                  </div>
                  <div className="text-[#8BE3FF] text-lg">→</div>
                  <div className="text-center">
                    <p className="text-[#4A5D6E] mb-1">After</p>
                    <p className="text-emerald-400 font-bold font-heading">#{impact.challenger.to} {match.challengerId?.ign}</p>
                    <p className="text-red-400 font-bold font-heading">#{impact.defender.to} {match.defenderId?.ign}</p>
                  </div>
                </div>
              ) : impact.type === 'insertion' ? (
                <div className="text-xs space-y-1">
                  <p className="text-emerald-400 font-heading font-bold">{match.challengerId?.ign} → #{impact.challenger.to} (promoted)</p>
                  <p className="text-amber-400 font-heading font-bold">{match.defenderId?.ign} → #{impact.defender.to} (shifted down)</p>
                  <p className="text-[#4A5D6E] text-[10px]">Players at #10 will become unranked.</p>
                </div>
              ) : null}
            </div>
          )}

          {resultError && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">{resultError}</div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setResultModal(false)} className="flex-1">CANCEL</Button>
            <Button
              variant="primary"
              onClick={handleConfirmResult}
              isLoading={submitting}
              disabled={!selectedResult}
              className="flex-1"
            >
              CONFIRM & APPLY RANKING
            </Button>
          </div>
        </div>
      </Modal>

      {/* Correct Result Modal */}
      <Modal isOpen={correctModal} onClose={() => setCorrectModal(false)} title="CORRECT MATCH RESULT" maxWidth="max-w-lg">
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/15">
            <p className="text-red-300 text-sm font-semibold">
              ⚠ High-risk operation. This will reverse the original ranking changes and apply corrected result. This action is audited.
            </p>
          </div>
          <div>
            <p className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest mb-2">Original Result</p>
            <p className="text-[#F4FBFF] font-heading font-bold uppercase text-sm">
              {match.result?.replace(/_/g, ' ')} — Winner: {match.winnerId?.ign || '—'}
            </p>
          </div>
          <div>
            <p className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest mb-2">New Correct Result</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setCorrectResult('CHALLENGER_WON')}
                className={`py-3 rounded-xl text-sm font-heading font-bold uppercase border transition-all ${
                  correctResult === 'CHALLENGER_WON'
                    ? 'bg-frost-50/10 border-frost-50/40 text-frost-100'
                    : 'border-frost-50/10 text-[#4A5D6E] hover:border-frost-50/20'
                }`}
              >
                {match.challengerId?.ign} WON
              </button>
              <button
                onClick={() => setCorrectResult('CHALLENGER_LOST')}
                className={`py-3 rounded-xl text-sm font-heading font-bold uppercase border transition-all ${
                  correctResult === 'CHALLENGER_LOST'
                    ? 'bg-frost-50/10 border-frost-50/40 text-frost-100'
                    : 'border-frost-50/10 text-[#4A5D6E] hover:border-frost-50/20'
                }`}
              >
                {match.defenderId?.ign} WON
              </button>
            </div>
          </div>
          <div>
            <label className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest block mb-1">Reason (required)</label>
            <input
              value={correctReason}
              onChange={e => setCorrectReason(e.target.value)}
              placeholder="Why is the result being corrected?"
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            />
          </div>
          {correctError && <p className="text-red-400 text-xs">{correctError}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setCorrectModal(false)} className="flex-1">CANCEL</Button>
            <Button
              variant="danger"
              onClick={handleCorrectResult}
              isLoading={correcting}
              disabled={!correctResult || !correctReason}
              className="flex-1"
            >
              CORRECT RESULT
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Evidence Modal */}
      <Modal isOpen={evidenceModal} onClose={() => setEvidenceModal(false)} title="ADD EVIDENCE" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest block mb-1">URL / Image Link</label>
            <input
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            />
          </div>
          <div>
            <label className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest block mb-1">Notes</label>
            <textarea
              value={evidenceNotes}
              onChange={e => setEvidenceNotes(e.target.value)}
              placeholder="Describe this evidence..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 resize-none"
            />
          </div>
          {evidenceError && <p className="text-red-400 text-xs">{evidenceError}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEvidenceModal(false)} className="flex-1">CANCEL</Button>
            <Button variant="primary" onClick={handleAddEvidence} isLoading={addingEvidence} className="flex-1">ADD EVIDENCE</Button>
          </div>
        </div>
      </Modal>

      {/* Dispute Confirm */}
      <ConfirmDialog
        isOpen={disputeConfirm}
        onClose={() => setDisputeConfirm(false)}
        onConfirm={handleDispute}
        title="MARK AS DISPUTED"
        message="This will set the match status to DISPUTED. You can resolve or correct the result afterwards."
        confirmText="MARK DISPUTED"
        variant="danger"
        isLoading={disputing}
      />
    </div>
  );
}
