import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, ChevronRight } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PlayerAvatar from '../player/PlayerAvatar';

const RankingRow = ({ rankDoc }) => {
  const navigate = useNavigate();
  const rank = rankDoc?.rank || 0;
  const players = rankDoc?.players || [];

  return (
    <Card
      variant="default"
      className="w-full border-frost-50/5 hover:border-frost-50/15 overflow-hidden flex flex-col md:flex-row md:items-center px-6 py-4 space-y-4 md:space-y-0"
    >
      {/* Rank Number */}
      <div className="flex items-center space-x-4 md:w-20 flex-shrink-0">
        <span className="font-heading text-2xl font-extrabold text-frost-50 drop-shadow-[0_0_8px_rgba(139,223,255,0.2)] tracking-wider">
          #{rank.toString().padStart(2, '0')}
        </span>
        <span className="text-secondary/30 text-xs md:hidden uppercase font-semibold">Rank</span>
      </div>

      {/* Players List in this Rank */}
      <div className="flex-1 flex flex-col space-y-4 md:space-y-3 divider-y divide-frost-50/5">
        {players.length === 0 ? (
          <div className="text-secondary text-sm py-2">VACANT POSITION</div>
        ) : (
          players.map((player) => (
            <div
              key={player._id}
              className="flex flex-col sm:flex-row sm:items-center justify-between py-2 sm:py-0 border-b border-frost-50/5 last:border-b-0 pb-3 last:pb-0"
            >
              {/* Player details */}
              <div
                className="flex items-center space-x-3 cursor-pointer group"
                onClick={() => navigate(`/players/${player._id}`)}
              >
                <PlayerAvatar profile={player} size="sm" />
                <div>
                  <h5 className="font-heading font-bold text-sm text-[#F4FBFF] group-hover:text-frost-50 transition-colors uppercase tracking-wider">
                    {player.ign}
                  </h5>
                  <p className="text-[#8A9AAD] text-xs">
                    UID: {player.pubgUid}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 mt-3 sm:mt-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/players/${player._id}`)}
                  className="flex items-center space-x-1"
                >
                  <span>PROFILE</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate(`/challenge/${player._id}`)}
                  className="flex items-center space-x-1"
                >
                  <Swords className="w-3.5 h-3.5" />
                  <span>CHALLENGE</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default RankingRow;
