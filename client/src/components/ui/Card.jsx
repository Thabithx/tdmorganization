import React from 'react';

const Card = ({
  children,
  variant = 'default',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyle = 'rounded-xl overflow-hidden transition-all duration-300';
  
  const variants = {
    default: 'glass-panel hover:border-frost-50/20',
    elevated: 'glass-panel-elevated hover:border-frost-50/30',
    highlight: 'glass-panel border-frost-50/30 shadow-[0_0_20px_rgba(139,223,255,0.08)]',
    gold: 'glass-panel glow-gold border-[#FFD700]/30',
    silver: 'glass-panel glow-silver border-[#C0C0C0]/30',
    bronze: 'glass-panel glow-bronze border-[#CD7F32]/30',
  };

  const clickableStyle = onClick ? 'cursor-pointer transform hover:-translate-y-0.5' : '';

  return (
    <div
      onClick={onClick}
      className={`${baseStyle} ${variants[variant]} ${clickableStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
