import React, { useState, useEffect } from 'react';
import { AlertOctagon, ExternalLink, CheckCircle, RotateCcw, XCircle, Flame, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { formatAmount, formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

export default function AdminDisputes() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  // Result override
  const [resultModal, setResultModal] = useState({ open: false, match: null });
  const [overrideResult, setOverrideResult] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resultError, setResultError] = useState('');

  // Cancel match
  const [cancelConfirm, setCancelConfirm] = useState({ open: false, matchId: null });
  const [cancelling, setCancelling] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminMatches({ status: 'DISPUTED' });
      if (res.success) setMatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const handleCorrectResult = async () => {
    if (!overrideResult || !overrideReason.trim()) return;
    setSubmitting(true);
    setResultError('');
    try {
      const m = resultModal.match;
      await adminService.correctMatchResult(m._id, overrideResult, overrideReason.trim());
      setResultModal({ open: false, match: null });
      setOverrideResult('');
      setOverrideReason('');
      fetchDisputes();
    } catch (err) {
      setResultError(err.response?.data?.message || 'Failed to correct result.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMatch = async () => {
    setCancelling(true);
    try {
      await adminService.updateMatchStatus(cancelConfirm.matchId, 'CANCELLED');
      setCancelConfirm({ open: false, matchId: null });
      fetchDisputes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-frost-800/20 animate-pulse border border-frost-50/5" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-xl font-black text-[#F4FBFF] uppercase tracking-wider">Dispute Management</h1>
        <p className="text-[#4A5D6E] text-xs mt-1">{matches.length} disputed match{matches.length !== 1 ? 'es' : ''} requiring resolution.</p>
      </div>

      {matches.length === 0 ? (
        <Card variant="default" className="border-frost-50/[0.06]">
          <div className="py-16 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400/30 mx-auto mb-4" />
            <p className="font-heading text-sm font-bold text-[#4A5D6E] uppercase tracking-widest">No Active Disputes</p>
            <p className="text-[#2A3D4E] text-xs mt-2">All disputed matches have been resolved.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map(row => {
            const m = row.match || row;
            const isExpanded = expanded === m._id;
            return (
              <Card key={m._id} variant="default" className="border-red-500/10 overflow-hidden">
                {/* Header */}
                <div
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer hover:bg-frost-50/[0.02] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : m._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-950/40 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                      <AlertOctagon className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="font-heading font-bold text-[#F4FBFF] uppercase text-sm">
                        {m.challengerId?.ign} <span className="text-[#4A5D6E] font-normal">vs</span> {m.defenderId?.ign}
                      </p>
                      <p className="text-[#4A5D6E] text-[10px] mt-0.5">{formatDate(m.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={m.platform} />
                    <span className="text-[#8BE3FF] font-heading font-bold text-sm">{formatAmount(m.challengeAmount)}</span>
                    <span className="text-red-300 text-xs font-heading font-semibold uppercase px-2 py-0.5 rounded border border-red-500/30 bg-red-950/30">DISPUTED</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-[#4A5D6E]" /> : <ChevronDown className="w-4 h-4 text-[#4A5D6E]" />}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-frost-50/[0.06] pt-4 space-y-4 bg-frost-900/10">
                    {/* Player ranks */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 rounded-lg bg-frost-800/20 border border-frost-50/5">
                        <p className="text-[#4A5D6E] uppercase font-heading font-semibold tracking-widest mb-1">Challenger</p>
                        <p className="text-[#F4FBFF] font-bold font-heading uppercase">{m.challengerId?.ign}</p>
                        <p className="text-[#4A5D6E]">Rank at match: {m.challengerRankAtMatch ? `#${m.challengerRankAtMatch}` : 'UNR'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-frost-800/20 border border-frost-50/5">
                        <p className="text-[#4A5D6E] uppercase font-heading font-semibold tracking-widest mb-1">Defender</p>
                        <p className="text-[#F4FBFF] font-bold font-heading uppercase">{m.defenderId?.ign}</p>
                        <p className="text-[#4A5D6E]">Rank at match: {m.defenderRankAtMatch ? `#${m.defenderRankAtMatch}` : 'UNR'}</p>
                      </div>
                    </div>

                    {/* Original result if any */}
                    {m.result && (
                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/10">
                        <p className="text-[#4A5D6E] text-[10px] font-heading font-semibold uppercase tracking-widest mb-1">Original Result</p>
                        <p className="text-amber-300 font-heading font-bold uppercase text-sm">
                          {m.result.replace(/_/g, ' ')} — {m.winnerId?.ign || '—'}
                        </p>
                      </div>
                    )}

                    {m.adminNotes && (
                      <div className="p-3 rounded-lg bg-frost-800/20 border border-frost-50/5">
                        <p className="text-[#4A5D6E] text-[10px] font-heading font-semibold uppercase tracking-widest mb-1">Admin Notes</p>
                        <p className="text-[#8A9AAD] text-xs whitespace-pre-wrap">{m.adminNotes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-frost-50/5">
                      <Link to={`/admin/matches/${m._id}`}>
                        <Button variant="secondary" size="sm" className="flex items-center gap-1.5">
                          <ExternalLink className="w-3.5 h-3.5" /> Full Detail
                        </Button>
                      </Link>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setResultModal({ open: true, match: m });
                          setOverrideResult('');
                          setOverrideReason('');
                          setResultError('');
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Correct & Resolve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setCancelConfirm({ open: true, matchId: m._id })}
                        className="flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel Match
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Result Correction Modal */}
      <Modal
        isOpen={resultModal.open}
        onClose={() => setResultModal({ open: false, match: null })}
        title="RESOLVE DISPUTE"
        maxWidth="max-w-lg"
      >
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/15">
            <p className="text-amber-300 text-sm font-semibold">
              Resolving dispute for{' '}
              <span className="text-[#F4FBFF] font-bold">
                {resultModal.match?.challengerId?.ign} vs {resultModal.match?.defenderId?.ign}
              </span>
            </p>
          </div>

          <div>
            <p className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest mb-2">Declare Correct Result</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOverrideResult('CHALLENGER_WON')}
                className={`py-3 px-3 rounded-xl text-xs font-heading font-bold uppercase border transition-all ${
                  overrideResult === 'CHALLENGER_WON'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'border-frost-50/10 text-[#4A5D6E] hover:border-frost-50/20'
                }`}
              >
                {resultModal.match?.challengerId?.ign}<br />
                <span className="text-[10px] opacity-70">WON</span>
              </button>
              <button
                onClick={() => setOverrideResult('CHALLENGER_LOST')}
                className={`py-3 px-3 rounded-xl text-xs font-heading font-bold uppercase border transition-all ${
                  overrideResult === 'CHALLENGER_LOST'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'border-frost-50/10 text-[#4A5D6E] hover:border-frost-50/20'
                }`}
              >
                {resultModal.match?.defenderId?.ign}<br />
                <span className="text-[10px] opacity-70">WON</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest block mb-1">
              Resolution Reason (required)
            </label>
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="Explain the basis for this resolution (evidence reviewed, etc.)..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 resize-none"
            />
          </div>

          {resultError && <p className="text-red-400 text-xs">{resultError}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setResultModal({ open: false, match: null })} className="flex-1">CANCEL</Button>
            <Button
              variant="primary"
              onClick={handleCorrectResult}
              isLoading={submitting}
              disabled={!overrideResult || !overrideReason.trim()}
              className="flex-1"
            >
              RESOLVE DISPUTE
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Match Confirm */}
      <ConfirmDialog
        isOpen={cancelConfirm.open}
        onClose={() => setCancelConfirm({ open: false, matchId: null })}
        onConfirm={handleCancelMatch}
        title="CANCEL DISPUTED MATCH"
        message="This will cancel the disputed match. No ranking changes will be applied. This action is audited."
        confirmText="CANCEL MATCH"
        variant="danger"
        isLoading={cancelling}
      />
    </div>
  );
}
