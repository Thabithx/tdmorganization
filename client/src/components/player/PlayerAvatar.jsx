import React from 'react';

// Aggressive gaming warrior SVG avatars rendered inline — no external dependency
// Each avatar is a unique warrior/soldier silhouette with ice-blue cyberpunk theme
const WARRIOR_AVATARS = [
  // Spartan helmet
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g0" cx="50%" cy="40%"><stop offset="0%" stop-color="#1a2a3a"/><stop offset="100%" stop-color="#05070D"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g0)"/>
    <ellipse cx="50" cy="42" rx="22" ry="26" fill="#0d1f2d" stroke="#4EDBFF" stroke-width="1.5"/>
    <path d="M28 42 Q28 20 50 16 Q72 20 72 42 L68 42 Q68 24 50 20 Q32 24 32 42Z" fill="#8BDFFF" opacity="0.9"/>
    <rect x="35" y="40" width="30" height="3" rx="1.5" fill="#4EDBFF"/>
    <rect x="38" y="45" width="24" height="18" rx="3" fill="#0d1f2d" stroke="#4EDBFF" stroke-width="1"/>
    <rect x="44" y="48" width="12" height="8" rx="1" fill="#050D1A"/>
    <path d="M38 63 Q50 68 62 63" stroke="#4EDBFF" stroke-width="1" fill="none"/>
    <path d="M50 14 L50 6" stroke="#8BDFFF" stroke-width="2" stroke-linecap="round"/>
    <path d="M46 10 L54 10" stroke="#4EDBFF" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="50" cy="90" r="14" fill="#0B101A" stroke="#4EDBFF" stroke-width="1"/>
    <path d="M38 90 Q50 84 62 90" fill="#1a2a3a" stroke="#4EDBFF" stroke-width="0.8"/>
  </svg>`,

  // Soldier with goggles
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g1" cx="50%" cy="35%"><stop offset="0%" stop-color="#111b27"/><stop offset="100%" stop-color="#050a10"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g1)"/>
    <circle cx="50" cy="38" r="20" fill="#0f1f2e" stroke="#00E5FF" stroke-width="1.5"/>
    <rect x="30" y="32" width="40" height="10" rx="5" fill="#05070D" stroke="#00E5FF" stroke-width="1.2"/>
    <circle cx="40" cy="37" r="5" fill="#001a20" stroke="#00E5FF" stroke-width="1"/>
    <circle cx="60" cy="37" r="5" fill="#001a20" stroke="#00E5FF" stroke-width="1"/>
    <circle cx="40" cy="37" r="2.5" fill="#00E5FF" opacity="0.6"/>
    <circle cx="60" cy="37" r="2.5" fill="#00E5FF" opacity="0.6"/>
    <rect x="29" y="36" width="2" height="2" rx="1" fill="#00E5FF"/>
    <rect x="69" y="36" width="2" height="2" rx="1" fill="#00E5FF"/>
    <path d="M35 50 Q50 58 65 50" stroke="#00E5FF" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <rect x="36" y="26" width="28" height="8" rx="4" fill="#0f1f2e" stroke="#00E5FF" stroke-width="0.8"/>
    <rect x="38" y="58" width="24" height="22" rx="4" fill="#0d1824" stroke="#00E5FF" stroke-width="1"/>
    <rect x="44" y="62" width="4" height="10" rx="2" fill="#00E5FF" opacity="0.5"/>
    <rect x="52" y="62" width="4" height="10" rx="2" fill="#00E5FF" opacity="0.5"/>
  </svg>`,

  // Monster warrior
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g2" cx="50%" cy="40%"><stop offset="0%" stop-color="#1a0a2e"/><stop offset="100%" stop-color="#08030f"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g2)"/>
    <ellipse cx="50" cy="42" rx="24" ry="26" fill="#1a0a2e" stroke="#9B59F5" stroke-width="1.5"/>
    <path d="M26 30 L30 22 L34 30" fill="#9B59F5" opacity="0.8"/>
    <path d="M66 30 L70 22 L74 30" fill="#9B59F5" opacity="0.8"/>
    <path d="M36 28 L40 18 L44 28" fill="#7B3FD5" opacity="0.7"/>
    <path d="M56 28 L60 18 L64 28" fill="#7B3FD5" opacity="0.7"/>
    <ellipse cx="38" cy="40" rx="8" ry="6" fill="#08030f" stroke="#9B59F5" stroke-width="1"/>
    <ellipse cx="62" cy="40" rx="8" ry="6" fill="#08030f" stroke="#9B59F5" stroke-width="1"/>
    <ellipse cx="38" cy="40" rx="4" ry="3" fill="#FF3366" opacity="0.8"/>
    <ellipse cx="62" cy="40" rx="4" ry="3" fill="#FF3366" opacity="0.8"/>
    <path d="M35 54 L39 50 L43 54 L47 50 L50 54 L53 50 L57 54 L61 50 L65 54" stroke="#9B59F5" stroke-width="1.5" fill="none"/>
    <circle cx="50" cy="88" r="16" fill="#1a0a2e" stroke="#9B59F5" stroke-width="1"/>
  </svg>`,

  // Viking warrior
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g3" cx="50%" cy="35%"><stop offset="0%" stop-color="#1a1200"/><stop offset="100%" stop-color="#0a0800"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g3)"/>
    <ellipse cx="50" cy="44" rx="20" ry="22" fill="#1a1200" stroke="#FFB800" stroke-width="1.5"/>
    <path d="M30 44 L26 48 L22 44 L26 40Z" fill="#FFB800" opacity="0.9"/>
    <path d="M70 44 L74 48 L78 44 L74 40Z" fill="#FFB800" opacity="0.9"/>
    <path d="M30 34 Q50 20 70 34 L70 38 Q50 26 30 38Z" fill="#FFB800" opacity="0.8"/>
    <circle cx="42" cy="44" r="5" fill="#0a0800" stroke="#FFB800" stroke-width="1"/>
    <circle cx="58" cy="44" r="5" fill="#0a0800" stroke="#FFB800" stroke-width="1"/>
    <circle cx="42" cy="44" r="2" fill="#FFB800" opacity="0.9"/>
    <circle cx="58" cy="44" r="2" fill="#FFB800" opacity="0.9"/>
    <path d="M40 56 Q50 62 60 56" stroke="#FFB800" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M36 58 Q38 56 36 54" stroke="#FFB800" stroke-width="1" fill="none"/>
    <path d="M64 58 Q62 56 64 54" stroke="#FFB800" stroke-width="1" fill="none"/>
    <rect x="36" y="62" width="28" height="20" rx="4" fill="#1a1200" stroke="#FFB800" stroke-width="1"/>
    <path d="M44 65 L56 65 L53 78 L47 78Z" fill="#FFB800" opacity="0.4"/>
  </svg>`,

  // Skull assassin
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g4" cx="50%" cy="40%"><stop offset="0%" stop-color="#0f1f10"/><stop offset="100%" stop-color="#050a06"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g4)"/>
    <ellipse cx="50" cy="42" rx="22" ry="24" fill="#0f1f10" stroke="#39FF14" stroke-width="1.5"/>
    <ellipse cx="40" cy="40" rx="7" ry="8" fill="#050a06" stroke="#39FF14" stroke-width="1"/>
    <ellipse cx="60" cy="40" rx="7" ry="8" fill="#050a06" stroke="#39FF14" stroke-width="1"/>
    <ellipse cx="40" cy="40" rx="3.5" ry="4" fill="#39FF14" opacity="0.7"/>
    <ellipse cx="60" cy="40" rx="3.5" ry="4" fill="#39FF14" opacity="0.7"/>
    <path d="M44 54 L47 57 L50 54 L53 57 L56 54" stroke="#39FF14" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M36 52 L40 55" stroke="#39FF14" stroke-width="1" stroke-linecap="round"/>
    <path d="M64 52 L60 55" stroke="#39FF14" stroke-width="1" stroke-linecap="round"/>
    <path d="M50 28 L50 22" stroke="#39FF14" stroke-width="1.5" opacity="0.5"/>
    <path d="M38 30 L34 24" stroke="#39FF14" stroke-width="1" opacity="0.4"/>
    <path d="M62 30 L66 24" stroke="#39FF14" stroke-width="1" opacity="0.4"/>
    <rect x="34" y="62" width="32" height="20" rx="4" fill="#0f1f10" stroke="#39FF14" stroke-width="1"/>
    <rect x="40" y="65" width="6" height="3" rx="1" fill="#39FF14" opacity="0.5"/>
    <rect x="54" y="65" width="6" height="3" rx="1" fill="#39FF14" opacity="0.5"/>
  </svg>`,

  // Cyber ninja
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="g5" cx="50%" cy="40%"><stop offset="0%" stop-color="#001a1a"/><stop offset="100%" stop-color="#000a0a"/></radialGradient></defs>
    <rect width="100" height="100" fill="url(#g5)"/>
    <ellipse cx="50" cy="42" rx="20" ry="24" fill="#001a1a" stroke="#00FFCC" stroke-width="1.5"/>
    <rect x="30" y="36" width="40" height="14" rx="3" fill="#000d0d" stroke="#00FFCC" stroke-width="1"/>
    <path d="M30 43 L70 43" stroke="#00FFCC" stroke-width="0.5" opacity="0.5"/>
    <rect x="38" y="38" width="10" height="10" rx="1" fill="#000d0d" stroke="#00FFCC" stroke-width="0.8"/>
    <rect x="52" y="38" width="10" height="10" rx="1" fill="#000d0d" stroke="#00FFCC" stroke-width="0.8"/>
    <rect x="40" y="40" width="6" height="6" fill="#00FFCC" opacity="0.5"/>
    <rect x="54" y="40" width="6" height="6" fill="#00FFCC" opacity="0.5"/>
    <path d="M28 36 Q26 28 32 24" stroke="#00FFCC" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <path d="M72 36 Q74 28 68 24" stroke="#00FFCC" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <rect x="30" y="50" width="40" height="4" rx="2" fill="#001a1a" stroke="#00FFCC" stroke-width="0.8"/>
    <rect x="36" y="58" width="28" height="22" rx="4" fill="#001a1a" stroke="#00FFCC" stroke-width="1"/>
    <path d="M42 64 L58 64" stroke="#00FFCC" stroke-width="1" opacity="0.6"/>
    <path d="M42 68 L58 68" stroke="#00FFCC" stroke-width="1" opacity="0.4"/>
    <path d="M42 72 L52 72" stroke="#00FFCC" stroke-width="1" opacity="0.3"/>
  </svg>`,
];

const getWarriorIndex = (ign = '') => {
  let hash = 0;
  for (let i = 0; i < ign.length; i++) hash = ign.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % WARRIOR_AVATARS.length;
};

const PlayerAvatar = ({ profile, size = 'md', className = '', objectPosition = 'center' }) => {
  const ign = profile?.ign || 'P';
  const avatar = profile?.avatar || '';

  const sizes = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 text-base',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-32 h-32 text-4xl',
  };

  const borderColors = () => {
    const rank = profile?.currentRank || null;
    if (rank === 1) return 'border-2 border-[#FFD700] shadow-[0_0_14px_rgba(255,215,0,0.3)]';
    if (rank === 2) return 'border-2 border-[#C0C0C0] shadow-[0_0_14px_rgba(192,192,192,0.25)]';
    if (rank === 3) return 'border-2 border-[#CD7F32] shadow-[0_0_14px_rgba(205,127,50,0.25)]';
    if (rank !== null) return 'border-2 border-frost-50/40 shadow-[0_0_10px_rgba(139,223,255,0.15)]';
    return 'border border-frost-50/10';
  };

  const warriorSvg = WARRIOR_AVATARS[getWarriorIndex(ign)];
  const svgDataUri = `data:image/svg+xml,${encodeURIComponent(warriorSvg)}`;

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#0B101A] select-none ${sizes[size]} ${borderColors()} ${className}`}>
      {avatar ? (
        <img
          src={avatar}
          alt={ign}
          className="w-full h-full object-cover"
          style={{ objectPosition }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = svgDataUri;
          }}
        />
      ) : (
        <img src={svgDataUri} alt={ign} className="w-full h-full object-cover" />
      )}
    </div>
  );
};

export default PlayerAvatar;
