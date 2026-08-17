import React from 'react';
import { Snowflake, CheckCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import FrostParticles from '../components/frost/FrostParticles';
import FrostLogo from '../components/frost/FrostLogo';
import useAuth from '../hooks/useAuth';

const WelcomeMessage = () => {
  const { user, profile } = useAuth();

  return (
    <div className="relative flex items-center justify-center min-h-[85vh] py-12 px-4">
      <FrostParticles />

      <div className="relative z-10 w-full max-w-xl">
        <Card variant="elevated" className="overflow-hidden border-frost-50/15 p-8 md:p-10 text-center space-y-6 shadow-[0_0_50px_rgba(139,227,255,0.05)]">
          {/* Header Icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8BE3FF]/20 to-[#1A3A4A]/60 border border-[#8BE3FF]/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,227,255,0.2)]">
            <Snowflake className="w-8 h-8 text-[#8BE3FF] animate-pulse" />
          </div>

          <FrostLogo className="text-3xl justify-center" />

          {/* Messages */}
          <div className="space-y-4 pt-2">
            <h1 className="font-heading text-2xl md:text-3xl font-black text-[#F4FBFF] uppercase tracking-wider">
              Welcome to FROST's Organization ❄️
            </h1>

            <p className="text-[#8BE3FF] font-heading font-bold text-sm md:text-base tracking-wide uppercase">
              You are now officially part of the FROST organization.
            </p>

            <div className="p-5 rounded-2xl bg-frost-800/40 border border-frost-50/10 text-[#8A9AAD] text-sm md:text-base leading-relaxed text-left space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-[#F4FBFF]">
                  After the tournament, we will create a TDM ranking based on player performance. Players in the ranking will be paid according to their performance.
                </p>
              </div>
            </div>

            <p className="text-[#4A5D6E] font-heading font-bold text-xs md:text-sm uppercase tracking-widest pt-2">
              Stay tuned. More is coming.
            </p>
          </div>

          {/* User badge */}
          <div className="pt-6 border-t border-frost-50/10 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[#F4FBFF] font-heading font-bold text-xs uppercase">{profile?.ign || user?.username}</p>
              <p className="text-[#4A5D6E] text-[10px] uppercase tracking-wider">{profile?.platform || 'PLAYER'}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default WelcomeMessage;
