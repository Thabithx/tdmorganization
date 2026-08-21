import React from 'react';

const DEFAULT_AVATAR = '/default_avatar.png';

const PlayerAvatar = ({ profile, size = 'md', className = '', objectPosition = 'center top' }) => {
  const ign = profile?.ign || 'P';
  const avatar = profile?.avatar || DEFAULT_AVATAR;

  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const borderColors = () => {
    const rank = profile?.currentRank || null;
    if (rank === 1) return 'border-2 border-[#FFD700] shadow-[0_0_14px_rgba(255,215,0,0.3)]';
    if (rank === 2) return 'border-2 border-[#C0C0C0] shadow-[0_0_14px_rgba(192,192,192,0.25)]';
    if (rank === 3) return 'border-2 border-[#CD7F32] shadow-[0_0_14px_rgba(205,127,50,0.25)]';
    if (rank !== null) return 'border-2 border-frost-50/40 shadow-[0_0_10px_rgba(139,223,255,0.15)]';
    return 'border border-frost-50/10';
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#0B101A] select-none flex items-start justify-center ${sizes[size]} ${borderColors()} ${className}`}>
      <img
        src={avatar}
        alt={ign}
        className="w-full h-full object-contain"
        style={{ objectPosition: profile?.avatarPosition || objectPosition }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = DEFAULT_AVATAR;
        }}
      />
    </div>
  );
};

export default PlayerAvatar;
