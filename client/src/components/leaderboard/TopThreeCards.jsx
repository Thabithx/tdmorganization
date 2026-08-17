import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Swords, Trophy, User } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PlayerAvatar from '../player/PlayerAvatar';

const TopThreeCards = ({ rank1, rank2, rank3 }) => {
  const navigate = useNavigate();

  const renderRankColumn = (rankDoc, rankNumber, title, cardVariant, bgClass, textGlow) => {
    const players = rankDoc?.players || [];

    return (
      <div className={`flex flex-col items-center w-full ${rankNumber === 1 ? 'order-1 md:order-2 md:-mt-6' : rankNumber === 2 ? 'order-2 md:order-1' : 'order-3'}`}>
        {/* Rank Header */}
        <div className="flex items-center space-x-1.5 mb-2 font-heading font-extrabold uppercase">
          {rankNumber === 1 && <Crown className="w-5 h-5 text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]" />}
          {rankNumber === 2 && <Trophy className="w-4 h-4 text-[#C0C0C0]" />}
          {rankNumber === 3 && <Trophy className="w-4 h-4 text-[#CD7F32]" />}
          <span className={`text-sm tracking-widest ${bgClass}`}>{title}</span>
        </div>

        {/* Players Card */}
        <Card variant={cardVariant} className="w-full flex flex-col items-center p-6 space-y-4 border-t-2 relative">
          <div className="absolute top-3 right-4 font-heading text-4xl font-extrabold opacity-10 tracking-widest italic select-none">
            {`0${rankNumber}`}
          </div>

          {players.length === 0 ? (
            <div className="text-secondary text-xs py-6">VACANT</div>
          ) : (
            players.map((player) => (
              <div key={player._id} className="w-full flex flex-col items-center text-center border-b border-frost-50/5 last:border-b-0 pb-4 last:pb-0">
                {/* Avatar */}
                <div className="relative group cursor-pointer" onClick={() => navigate(`/players/${player._id}`)}>
                  <PlayerAvatar profile={player} size="lg" objectPosition={player.avatarPosition} />
                  <span className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold border ${
                    rankNumber === 1 ? 'bg-[#FFD700] text-black border-[#FFD700]' :
                    rankNumber === 2 ? 'bg-[#C0C0C0] text-black border-[#C0C0C0]' :
                    'bg-[#CD7F32] text-black border-[#CD7F32]'
                  }`}>
                    {rankNumber}
                  </span>
                </div>

                {/* Info */}
                <h4
                  onClick={() => navigate(`/players/${player._id}`)}
                  className={`mt-3 font-heading font-bold text-base cursor-pointer hover:text-frost-50 transition-colors uppercase tracking-wider ${textGlow}`}
                >
                  {player.ign}
                </h4>
                <p className="text-secondary text-xs uppercase font-semibold tracking-wider mt-0.5">
                  UID: {player.pubgUid}
                </p>

                {/* Challenge CTA */}
                <div className="mt-4 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate(`/players/${player._id}`)}
                  >
                    PROFILE
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex items-center space-x-1"
                    onClick={() => navigate(`/challenge/${player._id}`)}
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>CHALLENGE</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 lg:gap-6 w-full max-w-5xl mx-auto py-4">
      {/* #2 Rank (Silver) */}
      {renderRankColumn(rank2, 2, '2nd Place', 'silver', 'text-[#C0C0C0]', 'group-hover:text-[#C0C0C0]')}

      {/* #1 Rank (Gold) */}
      {renderRankColumn(rank1, 1, '1st Champion', 'gold', 'text-[#FFD700] drop-shadow-[0_0_6px_rgba(255,215,0,0.3)]', 'text-[#F4FBFF]')}

      {/* #3 Rank (Bronze) */}
      {renderRankColumn(rank3, 3, '3rd Place', 'bronze', 'text-[#CD7F32]', 'group-hover:text-[#CD7F32]')}
    </div>
  );
};

export default TopThreeCards;
