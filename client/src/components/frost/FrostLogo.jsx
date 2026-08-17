import React from 'react';

const FrostLogo = ({ className = '', glow = true }) => {
  return (
    <div className={`flex items-center font-heading font-bold select-none ${className}`}>
      <span
        className={`text-transparent bg-clip-text bg-gradient-to-r from-frost-100 via-white to-frost-50 tracking-[0.2em] font-extrabold ${
          glow ? 'drop-shadow-[0_0_12px_rgba(139,223,255,0.6)]' : ''
        }`}
        style={{
          fontFamily: '"Space Grotesk", sans-serif',
        }}
      >
        FROST
      </span>
    </div>
  );
};

export default FrostLogo;
