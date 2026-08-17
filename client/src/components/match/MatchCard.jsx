import React from 'react';
import { ShieldCheck, Calendar, Flame } from 'lucide-react';
import Card from '../ui/Card';
import { formatAmount, formatDate, getNetPrize } from '../../utils/formatters';

const MatchCard = ({ match, currentUserId }) => {
  const challenger = match.challengerId;
  const defender = match.defenderId;
  const isChallenger = currentUserId && challenger._id?.toString() === currentUserId.toString();
  const displayAmount = isChallenger ? match.challengeAmount : getNetPrize(match.challengeAmount);

  const getRankFormatted = (r) => (r !== null && r !== undefined ? `#${r}` : 'UNRANKED');

  return (
    <Card variant="default" className="p-5 border-frost-50/5 hover:border-frost-50/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Matchup section */}
        <div className="flex items-center space-x-6">
          {/* Challenger */}
          <div className="flex flex-col items-end text-right">
            <span className="font-heading font-bold text-sm text-[#F4FBFF] uppercase tracking-wider">
              {challenger.ign}
            </span>
            <span className="text-[#8A9AAD] text-xs">
              {getRankFormatted(match.challengerRankAtMatch)}
            </span>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-[10px] font-heading font-extrabold uppercase bg-frost-800/80 px-2 py-0.5 rounded border border-frost-50/10 text-frost-50 shadow-[0_0_10px_rgba(139,223,255,0.05)]">
              VS
            </div>
          </div>

          {/* Defender */}
          <div className="flex flex-col items-start text-left">
            <span className="font-heading font-bold text-sm text-[#F4FBFF] uppercase tracking-wider">
              {defender.ign}
            </span>
            <span className="text-[#8A9AAD] text-xs">
              {getRankFormatted(match.defenderRankAtMatch)}
            </span>
          </div>
        </div>

        {/* Amount & Date info */}
        <div className="flex flex-col sm:items-end sm:text-right space-y-1">
          <span className="font-heading text-sm font-bold text-emerald-400">
            {formatAmount(displayAmount)}
          </span>
          <div className="flex items-center text-secondary/60 text-[10px] space-x-1 uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formatDate(match.matchCompletedAt)}</span>
          </div>
        </div>

        {/* Winner / Loss banner */}
        <div className="flex items-center justify-between sm:justify-end space-x-3 pt-3 sm:pt-0 border-t border-frost-50/5 sm:border-t-0">
          <div className="flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-frost-50" />
            <span className="font-heading text-xs font-bold text-[#F4FBFF] uppercase">
              {match.result === 'CHALLENGER_WON'
                ? `${challenger.ign} WON`
                : `${defender.ign} WON`}
            </span>
          </div>

          {match.verifiedBy && (
            <div className="flex items-center space-x-1 text-emerald-400 text-[10px] font-bold bg-emerald-950/20 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MatchCard;
