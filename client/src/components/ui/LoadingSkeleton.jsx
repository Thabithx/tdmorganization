import React from 'react';

const LoadingSkeleton = ({
  className = '',
  variant = 'text',
  count = 1,
}) => {
  const baseClass = 'animate-pulse bg-frost-700/50 rounded';
  
  const variants = {
    text: 'h-4 w-full my-2',
    avatar: 'rounded-full w-12 h-12',
    rect: 'h-32 w-full',
    line: 'h-2 w-3/4 my-1.5',
  };

  const renderSkeleton = (index) => (
    <div
      key={index}
      className={`${baseClass} ${variants[variant]} ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, rgba(16,23,34,0.4) 25%, rgba(20,28,40,0.6) 37%, rgba(16,23,34,0.4) 63%)',
        backgroundSize: '400% 100%',
        animation: 'pulse 2s infinite ease-in-out',
      }}
    />
  );

  return (
    <>
      {Array.from({ length: count }).map((_, i) => renderSkeleton(i))}
    </>
  );
};

export default LoadingSkeleton;
