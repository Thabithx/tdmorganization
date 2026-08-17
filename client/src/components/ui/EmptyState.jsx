import React from 'react';
import * as Icons from 'lucide-react';
import Card from './Card';

const EmptyState = ({
  iconName = 'HelpCircle',
  title = 'NO DATA AVAILABLE',
  message = 'There is currently no data to display here.',
  action,
  className = '',
}) => {
  const LucideIcon = Icons[iconName] || Icons.HelpCircle;

  return (
    <Card variant="default" className={`flex flex-col items-center justify-center text-center p-10 border-frost-50/10 ${className}`}>
      <div className="w-16 h-16 rounded-full bg-frost-800/60 border border-frost-50/10 flex items-center justify-center text-frost-50/70 mb-5 shadow-[0_0_20px_rgba(139,223,255,0.05)]">
        <LucideIcon className="w-8 h-8" />
      </div>
      <h3 className="font-heading text-lg font-bold text-frost-100 tracking-wider uppercase mb-2">
        {title}
      </h3>
      <p className="text-secondary text-sm max-w-md mb-6">
        {message}
      </p>
      {action}
    </Card>
  );
};

export default EmptyState;
