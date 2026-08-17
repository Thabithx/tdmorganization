import React from 'react';
import { Link } from 'react-router-dom';
import FrostLogo from '../frost/FrostLogo';
import { Swords } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-frost-50/5 bg-frost-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & tagline */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <FrostLogo className="text-xl" />
            <p className="text-secondary/50 text-xs tracking-widest uppercase">Asian TDM Competitive Network</p>
          </div>

          {/* Nav links */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-heading uppercase tracking-widest">
            <Link to="/rankings" className="text-secondary/60 hover:text-frost-50 transition-colors">Rankings</Link>
            <Link to="/players" className="text-secondary/60 hover:text-frost-50 transition-colors">Players</Link>
            <Link to="/challenge-rules" className="text-secondary/60 hover:text-frost-50 transition-colors flex items-center space-x-1">
              <Swords className="w-3 h-3" />
              <span>Challenge Rules</span>
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right space-y-1">
            <p className="text-secondary/40 text-xs">
              © {year} <span className="text-frost-50/60 font-semibold">FROST TDM Network</span>. All rights reserved.
            </p>
            <p className="text-secondary/30 text-[10px] leading-relaxed max-w-xs">
              All content, ranking systems, challenge mechanics, and platform design are the exclusive intellectual property of FROST TDM Network. Unauthorized reproduction or imitation is prohibited.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
