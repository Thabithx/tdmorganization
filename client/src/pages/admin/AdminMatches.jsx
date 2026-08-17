import React, { useState, useEffect } from 'react';
import { Flame, Play, ClipboardCheck, AlertOctagon, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, PlatformBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { formatAmount, formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const RESULT_STATUS_FILTERS = ['ALL', 'PENDING', 'COMPLETED', 'DISPUTED', 'CANCELLED'];

const AdminMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

  // Result Confirm Modal
  const [resultModal, setResultModal] = useState({ open: false, match: null });
  const [result, setResult] = useState('CHALLENGER_WON');
  const [submitting, setSubmitting] = useState(false);
  const [resultError, setResultError] = useState('');

  // Status Update
  const [statusModal, setStatusModal] = useState({ open: false, match: null, newStatus: '' });
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await adminService.getAdminMatches(params);
      if (res.success) setMatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, [statusFilter]);

  const handleConfirmResult = async () => {
    setSubmitting(true);
    setResultError('');
    try {
      const res = await adminService.confirmMatchResult(resultModal.match._id, result);
      if (res.data?.requiresAdminResolution) {
        setResultError('⚠ Shared rank conflict detected. Manual ranking resolution required. Contact ranking admin.');
      } else {
        setResultModal({ open: false, match: null });
        fetchMatches();
      }
    } catch (err) {
      setResultError(err.response?.data?.message || 'Failed to confirm result.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    setStatusUpdating(true);
    try {
      await adminService.updateMatchStatus(statusModal.match._id, statusModal.newStatus);
      setStatusModal({ open: false, match: null, newStatus: '' });
      fetchMatches();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const getMatchObject = (m) => m.match || m;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">MATCH MANAGEMENT</h1>

      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        {RESULT_STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase border transition-all ${
              statusFilter === s ? 'bg-frost-50/10 border-frost-50/30 text-frost-100' : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />)}
        </div>
      ) : matches.length === 0 ? (
        <EmptyState iconName="Flame" title="NO MATCHES" message="No matches found." />
      ) : (
        <div className="space-y-3">
          {matches.map(row => {
            const m = getMatchObject(row);
            const isExpanded = expandedId === m._id;
            const paymentConfirmed = row.paymentConfirmed;
            const challenge = row.challenge;

            return (
              <Card key={m._id} variant="default" className="overflow-hidden border-frost-50/5">
                {/* Row Header */}
                <div
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer hover:bg-frost-50/2 gap-3"
                  onClick={() => setExpandedId(isExpanded ? null : m._id)}
                >
                  <div className="flex items-center space-x-4">
                    <Flame className="w-4 h-4 text-frost-50/50 flex-shrink-0" />
                    <div>
                      <div className="font-heading font-bold text-[#F4FBFF] text-sm uppercase">
                        {m.challengerId?.ign} <span className="text-secondary text-xs font-normal">vs</span> {m.defenderId?.ign}
                      </div>
                      <div className="text-secondary text-xs mt-0.5">{formatDate(m.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <PlatformBadge platform={m.platform} />
                    <span className="font-heading font-bold text-frost-50 text-sm">{formatAmount(m.challengeAmount)}</span>
                    <span className={`text-xs font-heading font-semibold uppercase px-2 py-0.5 rounded border ${
                      m.resultStatus === 'COMPLETED' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      : m.resultStatus === 'DISPUTED' ? 'bg-red-950/40 border-red-500/30 text-red-300'
                      : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    }`}>
                      {m.resultStatus}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-secondary" /> : <ChevronDown className="w-4 h-4 text-secondary" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 py-4 border-t border-frost-50/10 space-y-5 bg-frost-900/20">
                    {/* Details grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-secondary uppercase font-heading font-semibold tracking-wider mb-1">Challenger</p>
                        <p className="text-[#F4FBFF] font-bold font-heading uppercase">{m.challengerId?.ign}</p>
                        <p className="text-secondary">Rank at match: {m.challengerRankAtMatch ? `#${m.challengerRankAtMatch}` : 'UNRANKED'}</p>
                      </div>
                      <div>
                        <p className="text-secondary uppercase font-heading font-semibold tracking-wider mb-1">Defender</p>
                        <p className="text-[#F4FBFF] font-bold font-heading uppercase">{m.defenderId?.ign}</p>
                        <p className="text-secondary">Rank at match: #{m.defenderRankAtMatch}</p>
                      </div>
                      <div>
                        <p className="text-secondary uppercase font-heading font-semibold tracking-wider mb-1">Payment</p>
                        <p className={`font-semibold font-heading uppercase text-sm ${paymentConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {paymentConfirmed ? '✓ CONFIRMED' : '⏳ PENDING'}
                        </p>
                      </div>
                      <div>
                        <p className="text-secondary uppercase font-heading font-semibold tracking-wider mb-1">Winner</p>
                        <p className="text-[#F4FBFF] font-bold font-heading uppercase">
                          {m.winnerId?.ign || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Admin notes */}
                    {m.adminNotes && (
                      <div className="p-3 rounded-lg bg-frost-800/40 border border-frost-50/5 text-secondary text-xs">
                        <span className="font-bold text-frost-100">Notes: </span>{m.adminNotes}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-frost-50/5">
                      {/* Set Match Active */}
                      {m.resultStatus === 'PENDING' && paymentConfirmed && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setStatusModal({ open: true, match: m, newStatus: 'MATCH_ACTIVE' })}
                          className="flex items-center space-x-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>START MATCH</span>
                        </Button>
                      )}

                      {/* Set Result Pending */}
                      {m.resultStatus === 'PENDING' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setStatusModal({ open: true, match: m, newStatus: 'RESULT_PENDING' })}
                          className="flex items-center space-x-1.5"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>SET RESULT PENDING</span>
                        </Button>
                      )}

                      {/* Confirm Final Result */}
                      {(m.resultStatus === 'RESULT_PENDING' || m.resultStatus === 'PENDING') && paymentConfirmed && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => { setResult('CHALLENGER_WON'); setResultError(''); setResultModal({ open: true, match: m }); }}
                          className="flex items-center space-x-1.5"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>CONFIRM RESULT</span>
                        </Button>
                      )}

                      {/* Mark Disputed */}
                      {!['COMPLETED', 'DISPUTED', 'CANCELLED'].includes(m.resultStatus) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setStatusModal({ open: true, match: m, newStatus: 'DISPUTED' })}
                          className="flex items-center space-x-1.5"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>DISPUTE</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Result Modal */}
      <Modal isOpen={resultModal.open} onClose={() => setResultModal({ open: false, match: null })} title="CONFIRM MATCH RESULT" maxWidth="max-w-md">
        <div className="space-y-5">
          <div className="p-4 rounded-xl bg-frost-900/60 border border-frost-50/5 text-center space-y-1">
            <p className="font-heading font-bold text-lg text-[#F4FBFF] uppercase">
              {resultModal.match?.challengerId?.ign} <span className="text-secondary text-sm">vs</span> {resultModal.match?.defenderId?.ign}
            </p>
            <p className="text-secondary text-xs">{formatAmount(resultModal.match?.challengeAmount)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Result</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setResult('CHALLENGER_WON')}
                className={`py-3 rounded-xl text-sm font-heading font-bold uppercase border transition-all ${
                  result === 'CHALLENGER_WON'
                    ? 'bg-frost-50/10 border-frost-50/40 text-frost-100'
                    : 'border-frost-50/10 text-secondary hover:border-frost-50/20'
                }`}
              >
                {resultModal.match?.challengerId?.ign} WON
              </button>
              <button
                onClick={() => setResult('CHALLENGER_LOST')}
                className={`py-3 rounded-xl text-sm font-heading font-bold uppercase border transition-all ${
                  result === 'CHALLENGER_LOST'
                    ? 'bg-frost-50/10 border-frost-50/40 text-frost-100'
                    : 'border-frost-50/10 text-secondary hover:border-frost-50/20'
                }`}
              >
                {resultModal.match?.defenderId?.ign} WON
              </button>
            </div>
          </div>

          {resultError && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs leading-relaxed">
              {resultError}
            </div>
          )}

          <div className="flex space-x-3">
            <Button variant="secondary" size="md" onClick={() => setResultModal({ open: false, match: null })} className="flex-1">CANCEL</Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConfirmResult}
              isLoading={submitting}
              className="flex-1"
            >
              CONFIRM & APPLY RANKING
            </Button>
          </div>
        </div>
      </Modal>

      {/* Status Update Confirm */}
      <ConfirmDialog
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, match: null, newStatus: '' })}
        onConfirm={handleStatusUpdate}
        title={`SET STATUS: ${statusModal.newStatus}`}
        message={`Update match status to ${statusModal.newStatus}?`}
        confirmText="CONFIRM"
        isLoading={statusUpdating}
      />
    </div>
  );
};

export default AdminMatches;
