import React from 'react';

const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-heading font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-frost-50 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-frost-50 to-[#58c5f2] text-[#05070D] hover:brightness-110 shadow-[0_0_15px_rgba(139,223,255,0.25)] hover:shadow-[0_0_20px_rgba(139,223,255,0.45)]',
    secondary: 'border border-frost-50/20 bg-frost-800/40 text-frost-100 hover:bg-frost-50/10 hover:border-frost-50/40',
    danger: 'bg-red-950/40 border border-red-500/30 text-red-200 hover:bg-red-500/20 hover:border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.1)]',
    success: 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3 text-base tracking-wide',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
