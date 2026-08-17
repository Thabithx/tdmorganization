import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Eye } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { RankBadge, PlatformBadge } from '../ui/Badge';
import PlayerAvatar from './PlayerAvatar';

const PlayerCard = ({ player }) => {
  const navigate = useNavigate();

  return (
    <Card
      variant="default"
      className="p-5 border-frost-50/5 hover:border-frost-50/15 flex flex-col items-center justify-between text-center min-h-[280px]"
    >
      <div className="flex flex-col items-center w-full">
        {/* Rank Badge */}
        <div className="w-full flex justify-end mb-1">
          <RankBadge rank={player.currentRank} size="sm" />
        </div>

        {/* Avatar */}
        <div className="cursor-pointer" onClick={() => navigate(`/players/${player._id}`)}>
          <PlayerAvatar profile={player} size="md" />
        </div>

        {/* IGN and Platform */}
        <h4
          onClick={() => navigate(`/players/${player._id}`)}
          className="mt-3 font-heading font-bold text-base hover:text-frost-50 cursor-pointer transition-colors uppercase tracking-wider text-[#F4FBFF]"
        >
          {player.ign}
        </h4>
        <div className="mt-1">
          <PlatformBadge platform={player.platform} />
        </div>

        {/* Short details */}
        <p className="text-secondary text-xs mt-2 uppercase font-semibold tracking-wider">
          UID: {player.pubgUid}
        </p>
      </div>

      {/* Profile Actions */}
      <div className="w-full grid grid-cols-2 gap-2 mt-5 pt-3 border-t border-frost-50/5">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/players/${player._id}`)}
          className="flex items-center justify-center space-x-1"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>VIEW</span>
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate(`/challenge/${player._id}`)}
          className="flex items-center justify-center space-x-1"
        >
          <Swords className="w-3.5 h-3.5" />
          <span>CHALLENGE</span>
        </Button>
      </div>
    </Card>
  );
};

export default PlayerCard;
