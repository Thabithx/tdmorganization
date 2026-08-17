import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, DollarSign, TrendingUp } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/Badge';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import { formatAmount, formatDate, getPlatformFee, getNetPrize } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, payment: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const res = await adminService.getAdminPayments(params);
      if (res.success) setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, [statusFilter]);

  const handleConfirm = async () => {
    setActionLoading(true);
    try {
      await adminService.confirmPaymentManual(confirmDialog.payment._id);
      fetchPayments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm payment.');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, payment: null });
    }
  };

  const STATUS_FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED'];

  const confirmedPayments = payments.filter(p => p.status === 'CONFIRMED');
  const totalGrossStakes = confirmedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalAdminProfit = getPlatformFee(totalGrossStakes);
  const totalWinnerPayouts = getNetPrize(totalGrossStakes);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">PAYMENT & REVENUE MANAGEMENT</h1>
          <p className="text-[#4A5D6E] text-xs font-semibold uppercase tracking-widest mt-1">20% Platform Revenue Fee & Financial Transactions</p>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="default" className="p-5 border-frost-50/5">
          <p className="text-[#4A5D6E] text-xs font-heading font-semibold uppercase tracking-widest mb-1">Total Confirmed Stakes</p>
          <p className="font-heading text-2xl font-extrabold text-[#F4FBFF]">{formatAmount(totalGrossStakes)}</p>
        </Card>
        <Card variant="default" className="p-5 border-[#8BE3FF]/20 bg-[#8BE3FF]/5">
          <p className="text-[#8BE3FF] text-xs font-heading font-bold uppercase tracking-widest mb-1">Platform Admin Profit (20%)</p>
          <p className="font-heading text-2xl font-black text-[#8BE3FF]">{formatAmount(totalAdminProfit)}</p>
        </Card>
        <Card variant="default" className="p-5 border-emerald-500/20 bg-emerald-950/10">
          <p className="text-emerald-400 text-xs font-heading font-semibold uppercase tracking-widest mb-1">Player Winner Net Payouts (80%)</p>
          <p className="font-heading text-2xl font-extrabold text-emerald-400">{formatAmount(totalWinnerPayouts)}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        {STATUS_FILTERS.map(s => (
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
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />)}
        </div>
      ) : payments.length === 0 ? (
        <EmptyState iconName="CreditCard" title="NO PAYMENTS" message="No payments found with selected filters." />
      ) : (
        <Card variant="default" className="overflow-hidden border-frost-50/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-frost-50/10 bg-frost-800/40 text-secondary text-xs uppercase font-heading tracking-widest">
                  <th className="px-4 py-3 text-left">Challenge</th>
                  <th className="px-4 py-3 text-left">Payer</th>
                  <th className="px-4 py-3 text-left">Total Stake</th>
                  <th className="px-4 py-3 text-left">Winner Payout (80%)</th>
                  <th className="px-4 py-3 text-left">Admin Profit (20%)</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-frost-50/5">
                {payments.map(p => (
                  <tr key={p._id} className="hover:bg-frost-50/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-heading text-xs font-bold text-[#F4FBFF] uppercase">
                        {p.challengeId?.challengerId?.ign} <span className="text-secondary">vs</span> {p.challengeId?.defenderId?.ign}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-heading font-bold text-sm text-[#F4FBFF] uppercase">{p.payerId?.ign}</td>
                    <td className="px-4 py-3 font-heading font-bold text-frost-50">{formatAmount(p.amount)}</td>
                    <td className="px-4 py-3 font-heading font-bold text-emerald-400">{formatAmount(getNetPrize(p.amount))}</td>
                    <td className="px-4 py-3 font-heading font-bold text-[#8BE3FF]">{formatAmount(getPlatformFee(p.amount))}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-secondary text-xs">{formatDate(p.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'PENDING' && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setConfirmDialog({ open: true, payment: p })}
                          className="flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>CONFIRM</span>
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
        onClose={() => setConfirmDialog({ open: false, payment: null })}
        onConfirm={handleConfirm}
        title="CONFIRM PAYMENT"
        message={`Manually confirm payment of ${formatAmount(confirmDialog.payment?.amount)} from ${confirmDialog.payment?.payerId?.ign}? This will advance the challenge to MATCH_PENDING status.`}
        confirmText="YES, CONFIRM PAYMENT"
        variant="success"
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AdminPayments;
