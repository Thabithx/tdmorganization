import React, { useState } from 'react';
import { Swords, CreditCard, XCircle, CheckCircle, Clock } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { StatusBadge, PlatformBadge } from '../ui/Badge';
import { formatAmount, formatDate, getNetPrize } from '../../utils/formatters';
import Modal from '../ui/Modal';
import useAuth from '../../hooks/useAuth';
import * as paymentService from '../../services/payment.service';

const ChallengeCard = ({ challenge, onStatusUpdate, isOldestPending }) => {
  const { profile } = useAuth();
  const [loadingAction, setLoadingAction] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewReason, setReviewReason] = useState('');

  const isChallenger = challenge.challengerId?._id?.toString() === profile?._id?.toString();
  const opponent = isChallenger ? challenge.defenderId : challenge.challengerId;

  // Defender sees 720 (net prize), Challenger sees 900 (stake amount)
  const displayAmount = isChallenger ? challenge.challengeAmount : getNetPrize(challenge.challengeAmount);

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

  const handleCancel = async () => {
    setLoadingAction(true);
    try {
      await onStatusUpdate(challenge._id, 'cancel');
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

  const expirationTime = new Date(new Date(challenge.createdAt).getTime() + 72 * 60 * 60 * 1000);
  const getRemainingTime = () => {
    const diff = expirationTime.getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
    const days = Math.floor(hours / 24);
    const remHours = hours % 24;
    return `${days}d ${remHours}h`;
  };

  return (
    <Card variant="default" className="p-5 border-frost-50/5 flex flex-col justify-between h-full min-h-[170px]">
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

          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-frost-50/5">
            <PlatformBadge platform={challenge.platform} />
            <span className="font-heading text-base font-bold text-emerald-400">
              {isChallenger ? 'Challenge Amount:' : 'Prize:'} {formatAmount(displayAmount)}
            </span>
          </div>

          <div className="mt-2 flex flex-col space-y-1 text-secondary/50 text-[10px]">
            <p>Created: {formatDate(challenge.createdAt)}</p>
            {challenge.status === 'PENDING' && (
              <p className="text-frost-50 font-bold uppercase tracking-wider">
                Expires: {formatDate(expirationTime)} ({getRemainingTime()})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-frost-50/5 flex justify-end space-x-2">
        {!isChallenger && challenge.status === 'PENDING' && (
          <div className="flex flex-col w-full gap-2">
            {!isOldestPending && (
              <p className="text-amber-400 text-xs text-center font-semibold uppercase tracking-widest bg-amber-500/10 py-1.5 rounded">
                Respond to older challenges first
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReviewModal(true)}
                disabled={loadingAction || !isOldestPending}
                className="flex items-center space-x-1"
              >
                <span>REQUEST REVIEW</span>
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleReject}
                isLoading={loadingAction}
                disabled={!isOldestPending}
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
                disabled={!isOldestPending}
                className="flex items-center space-x-1"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>ACCEPT</span>
              </Button>
            </div>
          </div>
        )}

        {isChallenger && challenge.status === 'PENDING' && (
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              isLoading={loadingAction}
              className="flex items-center space-x-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>CANCEL</span>
            </Button>
            <div className="flex items-center space-x-1 text-secondary/60 text-xs font-semibold uppercase tracking-wider py-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Response</span>
            </div>
          </div>
        )}

        {isChallenger && challenge.status === 'PAYMENT_PENDING' && (
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              isLoading={loadingAction}
              className="flex items-center justify-center space-x-1 flex-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>CANCEL</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePay}
              isLoading={loadingAction}
              className="flex items-center space-x-1.5 justify-center flex-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>PAY {formatAmount(challenge.challengeAmount)}</span>
            </Button>
          </div>
        )}
      </div>

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="REQUEST ADMIN REVIEW" maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-secondary text-sm">
            If you have a valid emergency (traveling, sick, etc.), you can request an Admin Review instead of rejecting the challenge. The timer will pause until an Admin resolves it.
          </p>
          <div>
            <label className="text-xs font-heading font-semibold text-[#4A5D6E] uppercase tracking-widest block mb-1">Reason</label>
            <textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              className="w-full bg-[#06090F] border border-frost-50/10 rounded-xl px-4 py-3 text-sm text-[#F4FBFF] focus:outline-none focus:border-[#8BE3FF]/50 transition-colors"
              placeholder="Explain why you cannot accept this challenge..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)} disabled={loadingAction}>Cancel</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!reviewReason.trim()) return alert("Please enter a reason.");
                setLoadingAction(true);
                try {
                  await onStatusUpdate(challenge._id, 'admin-review', reviewReason);
                  setShowReviewModal(false);
                } catch (_) {}
                setLoadingAction(false);
              }}
              isLoading={loadingAction}
              disabled={!reviewReason.trim()}
            >
              Submit Request
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default ChallengeCard;
