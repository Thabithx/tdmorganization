import React, { useState } from 'react';
import { Swords, CreditCard, XCircle, CheckCircle, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { StatusBadge, PlatformBadge } from '../ui/Badge';
import { formatAmount, formatDate, getNetPrize } from '../../utils/formatters';
import useAuth from '../../hooks/useAuth';
import * as paymentService from '../../services/payment.service';

const ChallengeCard = ({ challenge, onStatusUpdate }) => {
  const { profile } = useAuth();
  const [loadingAction, setLoadingAction] = useState(false);

  const isChallenger = challenge.challengerId?._id?.toString() === profile?._id?.toString();
  const opponent = isChallenger ? challenge.defenderId : challenge.challengerId;
  const winnerPrize = getNetPrize(challenge.challengeAmount);

  const handleAccept = async () => {
    setLoadingAction(true);
    try {
      await onStatusUpdate(challenge._id, 'accept');
    } catch (_) {}
    setLoadingAction(false);
  };

  const handleReject = async () => {
    setLoadingAction(true);
    try {
      await onStatusUpdate(challenge._id, 'reject');
    } catch (_) {}
    setLoadingAction(false);
  };

  const handlePay = async () => {
    setLoadingAction(true);
    try {
      const res = await paymentService.createPayment(challenge._id);
      if (res.success && res.data.payhereUrl) {
        const { payhereUrl, payload } = res.data;
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = payhereUrl;

        Object.entries(payload).forEach(([key, val]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = val;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment initiation failed.');
    }
    setLoadingAction(false);
  };

  return (
    <Card variant="default" className="p-5 border-frost-50/5 flex flex-col justify-between h-full min-h-[180px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Swords className="w-4 h-4 text-frost-50" />
            <span className="font-heading text-xs font-semibold tracking-wider text-secondary uppercase">
              {isChallenger ? 'Outgoing Challenge' : 'Incoming Challenge'}
            </span>
          </div>
          <StatusBadge status={challenge.status} />
        </div>

        {/* Competitors and Details */}
        <div className="mt-4">
          <h4 className="font-heading text-base font-bold text-frost-100 uppercase tracking-wide">
            vs {opponent?.ign}
          </h4>
          <p className="text-secondary text-xs uppercase font-semibold tracking-wider mt-0.5">
            UID: {opponent?.pubgUid}
          </p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <PlatformBadge platform={challenge.platform} />
            <span className="font-heading text-sm font-bold text-frost-50">
              Stake: {formatAmount(challenge.challengeAmount)}
            </span>
          </div>

          <div className="mt-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/10 flex items-center justify-between">
            <span className="text-[#4A5D6E] text-[11px] uppercase font-heading font-semibold">Winner Net Payout (80%):</span>
            <span className="text-emerald-400 font-heading font-bold text-xs">{formatAmount(winnerPrize)}</span>
          </div>

          <p className="text-secondary/50 text-[10px] mt-2">
            Created: {formatDate(challenge.createdAt)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 pt-3 border-t border-frost-50/5 flex justify-end space-x-2">
        {!isChallenger && challenge.status === 'PENDING' && (
          <>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              isLoading={loadingAction}
              className="flex items-center space-x-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>REJECT</span>
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={handleAccept}
              isLoading={loadingAction}
              className="flex items-center space-x-1"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ACCEPT</span>
            </Button>
          </>
        )}

        {isChallenger && challenge.status === 'PENDING' && (
          <div className="flex items-center space-x-1 text-secondary/60 text-xs font-semibold uppercase tracking-wider py-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Waiting for accept</span>
          </div>
        )}

        {isChallenger && challenge.status === 'PAYMENT_PENDING' && (
          <Button
            variant="primary"
            size="sm"
            onClick={handlePay}
            isLoading={loadingAction}
            className="flex items-center space-x-1.5 w-full justify-center"
          >
            <CreditCard className="w-4 h-4" />
            <span>PAY {formatAmount(challenge.challengeAmount)} NOW</span>
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ChallengeCard;
