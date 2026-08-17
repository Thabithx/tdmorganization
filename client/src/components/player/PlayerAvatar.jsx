import React from 'react';

const PlayerAvatar = ({ profile, size = 'md', className = '' }) => {
  const ign = profile?.ign || 'P';
  const avatar = profile?.avatar || '';

  // Get initials for fallback
  const initials = ign
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const sizes = {
    sm: 'w-10 h-10 text-xs border-2',
    md: 'w-16 h-16 text-base border-2',
    lg: 'w-24 h-24 text-2xl border-4',
    xl: 'w-32 h-32 text-4xl border-4',
  };

  // Border colors matching current rank or default ice-blue
  const getBorderColor = () => {
    const rank = profile?.currentRank || null;
    if (rank === 1) return 'border-[#FFD700] shadow-[0_0_10px_rgba(255,215,0,0.2)]';
    if (rank === 2) return 'border-[#C0C0C0] shadow-[0_0_10px_rgba(192,192,192,0.2)]';
    if (rank === 3) return 'border-[#CD7F32] shadow-[0_0_10px_rgba(205,127,50,0.2)]';
    if (rank !== null) return 'border-frost-50/40 shadow-[0_0_10px_rgba(139,223,255,0.15)]';
    return 'border-frost-50/10';
  };

  return (
    <div
      className={`relative rounded-full flex items-center justify-center bg-[#0B101A] font-heading font-bold uppercase select-none overflow-hidden ${
        sizes[size]
      } ${getBorderColor()} ${className}`}
    >
      {avatar ? (
        <img
          src={avatar}
          alt={ign}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = ''; // trigger fallback to initials
          }}
        />
      ) : (
        <span className="text-secondary/70">{initials}</span>
      )}
    </div>
  );
};

export default PlayerAvatar;
