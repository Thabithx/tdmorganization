import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: 'bg-amber-950/40 border border-amber-500/30 text-amber-200',
    ACCEPTED: 'bg-blue-950/40 border border-blue-500/30 text-blue-200',
    REJECTED: 'bg-red-950/40 border border-red-500/30 text-red-200',
    PAYMENT_PENDING: 'bg-orange-950/40 border border-orange-500/30 text-orange-200',
    PAYMENT_CONFIRMED: 'bg-teal-950/40 border border-teal-500/30 text-teal-200',
    MATCH_PENDING: 'bg-indigo-950/40 border border-indigo-500/30 text-indigo-200',
    MATCH_ACTIVE: 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200',
    RESULT_PENDING: 'bg-yellow-950/40 border border-yellow-500/30 text-yellow-200',
    COMPLETED: 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200',
    DISPUTED: 'bg-red-950/40 border border-red-500/30 text-red-200',
    CANCELLED: 'bg-zinc-800/40 border border-zinc-600/30 text-zinc-300',
  };

  const formattedStatus = status?.replace('_', ' ') || 'UNKNOWN';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide border uppercase ${styles[status] || styles.CANCELLED}`}>
      {formattedStatus}
    </span>
  );
};

export const RankBadge = ({ rank, size = 'md' }) => {
  if (rank === null || rank === undefined) {
    return (
      <span className="inline-flex items-center justify-center font-heading border border-frost-100/10 bg-frost-800/40 text-[#8A9AAD] rounded px-2.5 py-0.5 text-xs font-semibold uppercase">
        Unranked
      </span>
    );
  }

  const sizes = {
    sm: 'text-xs w-6 h-6',
    md: 'text-sm w-9 h-9',
    lg: 'text-lg w-12 h-12',
  };

  const badgeColors = {
    1: 'bg-gradient-to-br from-[#FFD700] to-[#B8860B] border-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]',
    2: 'bg-gradient-to-br from-[#C0C0C0] to-[#708090] border-[#C0C0C0] text-black shadow-[0_0_15px_rgba(192,192,192,0.3)]',
    3: 'bg-gradient-to-br from-[#CD7F32] to-[#8B4513] border-[#CD7F32] text-black shadow-[0_0_15px_rgba(205,127,50,0.3)]',
  };

  const defaultBadge = 'bg-gradient-to-br from-frost-700 to-frost-900 border-frost-50/20 text-frost-100 shadow-[0_0_10px_rgba(139,223,255,0.05)]';

  const badgeStyle = badgeColors[rank] || defaultBadge;

  return (
    <span className={`inline-flex items-center justify-center font-heading font-bold rounded-full border ${badgeStyle} ${sizes[size]}`}>
      {rank}
    </span>
  );
};

export const PlatformBadge = ({ platform }) => {
  const styles = {
    MOBILE: 'border-cyan-500/20 bg-cyan-950/20 text-cyan-300',
    IPAD: 'border-violet-500/20 bg-violet-950/20 text-violet-300',
    EMULATOR: 'border-amber-500/20 bg-amber-950/20 text-amber-300',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase border ${styles[platform] || 'border-zinc-500/20 bg-zinc-950/20 text-zinc-300'}`}>
      {platform}
    </span>
  );
};
