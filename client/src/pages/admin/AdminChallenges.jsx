import React, { useState, useEffect } from 'react';
import { Swords, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge, PlatformBadge } from '../../components/ui/Badge';
import { formatAmount, formatDate } from '../../utils/formatters';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import * as adminService from '../../services/admin.service';

const STATUS_FILTERS = ['ALL', 'PENDING', 'PAYMENT_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED', 'DISPUTED'];

const AdminChallenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, challenge: null, newStatus: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await adminService.getAdminChallenges(params);
      if (res.success) setChallenges(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallenges(); }, [statusFilter]);

  const handleStatusChange = async () => {
    setActionLoading(true);
    try {
      await adminService.updateChallengeStatus(confirmDialog.challenge._id, confirmDialog.newStatus, 'Admin action');
      fetchChallenges();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, challenge: null, newStatus: '' });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">CHALLENGE MANAGEMENT</h1>

      {/* Status Filters */}
      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase border transition-all ${
              statusFilter === s ? 'bg-frost-50/10 border-frost-50/30 text-frost-100' : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />)}
        </div>
      ) : challenges.length === 0 ? (
        <EmptyState iconName="Swords" title="NO CHALLENGES" message="No challenges found with selected filters." />
      ) : (
        <Card variant="default" className="overflow-hidden border-frost-50/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-frost-50/10 bg-frost-800/40 text-secondary text-xs uppercase font-heading tracking-widest">
                  <th className="px-4 py-3 text-left">Matchup</th>
                  <th className="px-4 py-3 text-left">Platform</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-frost-50/5">
                {challenges.map(c => (
                  <tr key={c._id} className="hover:bg-frost-50/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-heading font-bold text-[#F4FBFF] text-sm uppercase">
                        {c.challengerId?.ign} <span className="text-secondary text-xs font-normal">vs</span> {c.defenderId?.ign}
                      </div>
                      <div className="text-secondary text-xs">#{c.challengerRankAtCreation || 'UNR'} vs #{c.defenderRankAtCreation}</div>
                    </td>
                    <td className="px-4 py-3"><PlatformBadge platform={c.platform} /></td>
                    <td className="px-4 py-3 font-heading font-bold text-frost-50">{formatAmount(c.challengeAmount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-3 text-secondary text-xs">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {!['COMPLETED', 'REJECTED', 'CANCELLED'].includes(c.status) && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmDialog({ open: true, challenge: c, newStatus: 'CANCELLED' })}
                          className="flex items-center space-x-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>CANCEL</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, challenge: null, newStatus: '' })}
        onConfirm={handleStatusChange}
        title="CANCEL CHALLENGE"
        message={`Are you sure you want to cancel this challenge between ${confirmDialog.challenge?.challengerId?.ign} and ${confirmDialog.challenge?.defenderId?.ign}?`}
        confirmText="YES, CANCEL IT"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AdminChallenges;
