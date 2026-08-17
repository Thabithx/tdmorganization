import React from 'react';
import { motion } from 'framer-motion';

const PlatformTabs = ({ activePlatform, onChange }) => {
  const platforms = ['MOBILE', 'IPAD', 'EMULATOR'];

  return (
    <div className="flex justify-center p-1 rounded-xl bg-frost-800/80 border border-frost-50/10 backdrop-blur-md max-w-sm mx-auto">
      {platforms.map((platform) => (
        <button
          key={platform}
          onClick={() => onChange(platform)}
          className={`relative flex-1 py-2 text-xs font-heading font-semibold uppercase tracking-wider transition-colors duration-300 ${
            activePlatform === platform ? 'text-[#05070D]' : 'text-secondary hover:text-frost-50'
          }`}
        >
          {activePlatform === platform && (
            <motion.div
              layoutId="activePlatformTab"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute inset-0 bg-gradient-to-r from-frost-50 to-[#58c5f2] rounded-lg"
            />
          )}
          <span className="relative z-10">{platform}</span>
        </button>
      ))}
    </div>
  );
};

export default PlatformTabs;
