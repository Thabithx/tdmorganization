import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const ChallengeStatus = ({ status }) => {
  const steps = [
    { label: 'Challenged', keys: ['PENDING', 'ACCEPTED', 'REJECTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED'] },
    { label: 'Accepted', keys: ['ACCEPTED', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED'] },
    { label: 'Payment Verified', keys: ['PAYMENT_CONFIRMED', 'MATCH_PENDING', 'MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED'] },
    { label: 'Match Active', keys: ['MATCH_ACTIVE', 'RESULT_PENDING', 'COMPLETED'] },
    { label: 'Completed', keys: ['COMPLETED'] },
  ];

  const getStepState = (keys) => {
    if (status === 'REJECTED' && keys.includes('ACCEPTED')) return 'failed';
    if (status === 'CANCELLED') return 'cancelled';
    if (keys.includes(status)) return 'active';
    // If the status is past the keys, it's completed
    const currentStepIndex = steps.findIndex(s => s.keys.includes(status));
    const stepIndex = steps.findIndex(s => s.keys === keys);
    if (currentStepIndex > stepIndex) return 'done';
    return 'pending';
  };

  return (
    <div className="w-full py-6 flex items-center justify-between">
      {steps.map((step, idx) => {
        const state = getStepState(step.keys);
        
        return (
          <React.Fragment key={idx}>
            {/* Step node */}
            <div className="flex flex-col items-center flex-1 relative">
              {state === 'done' ? (
                <CheckCircle2 className="w-6 h-6 text-frost-50 drop-shadow-[0_0_8px_rgba(139,223,255,0.4)]" />
              ) : state === 'active' ? (
                <div className="w-6 h-6 rounded-full border-2 border-frost-50 bg-[#05070D] flex items-center justify-center animate-pulse">
                  <div className="w-2.5 h-2.5 rounded-full bg-frost-50" />
                </div>
              ) : state === 'failed' ? (
                <div className="w-6 h-6 rounded-full border-2 border-red-500 bg-red-950/20 flex items-center justify-center">
                  <span className="text-red-400 text-xs font-bold font-heading">X</span>
                </div>
              ) : (
                <Circle className="w-6 h-6 text-secondary/35" />
              )}
              <span className={`text-[10px] mt-2 font-heading font-semibold uppercase tracking-wider ${
                state === 'active' ? 'text-frost-50' : 'text-secondary'
              }`}>
                {step.label}
              </span>
            </div>

            {/* Step connector line */}
            {idx < steps.length - 1 && (
              <div className={`h-[2px] flex-1 -mx-8 relative -top-3 ${
                getStepState(steps[idx + 1].keys) === 'done' || getStepState(steps[idx + 1].keys) === 'active'
                  ? 'bg-frost-50/40'
                  : 'bg-secondary/10'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default ChallengeStatus;
