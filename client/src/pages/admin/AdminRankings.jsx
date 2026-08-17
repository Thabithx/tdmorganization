import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ArrowUpDown, Save, AlertTriangle, Move, ChevronUp, ChevronDown, RefreshCw, UserPlus, Check, X } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { RankBadge, PlatformBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import * as adminService from '../../services/admin.service';

const PLATFORMS = ['MOBILE', 'IPAD', 'EMULATOR'];

export default function AdminRankings() {
  const [platform, setPlatform] = useState('MOBILE');
  const [rankings, setRankings] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Drag state
  const [draggedPlayer, setDraggedPlayer] = useState(null); // { player, currentRank }
  const [dragOverRank, setDragOverRank] = useState(null);

  // Confirmation dialog state
  const [confirmModal, setConfirmModal] = useState({ open: false, action: null, payload: null, title: '', message: '' });
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Add player modal state
  const [addModal, setAddModal] = useState({ open: false, targetRank: 1 });
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [addReason, setAddReason] = useState('');
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const [rankRes, playerRes] = await Promise.all([
        adminService.getAdminRankings({ platform }),
        adminService.getAdminPlayers({ platform })
      ]);
      if (rankRes.success) setRankings(rankRes.data);
      if (playerRes.success) setAllPlayers(playerRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRankings(); }, [platform]);

  // Execute Ranking Adjustment
  const executeAdjustment = async (payload) => {
    setSaving(true);
    setError('');
    try {
      await adminService.manualRankingUpdate({
        platform,
        ...payload
      });
      setConfirmModal({ open: false, action: null, payload: null, title: '', message: '' });
      setReason('');
      fetchRankings();
    } catch (err) {
      setError(err.response?.data?.message || 'Ranking update failed.');
    } finally {
      setSaving(false);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, player, currentRank) => {
    setDraggedPlayer({ player, currentRank });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', player._id);
  };

  const handleDragOver = (e, targetRank) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverRank !== targetRank) {
      setDragOverRank(targetRank);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOverRank(null);
  };

  const handleDropOnRank = (e, targetRank) => {
    e.preventDefault();
    setDragOverRank(null);
    if (!draggedPlayer) return;

    const { player, currentRank } = draggedPlayer;
    if (currentRank === targetRank) return;

    setConfirmModal({
      open: true,
      action: 'MOVE',
      payload: {
        action: 'MOVE_TO_RANK',
        playerId: player._id,
        targetRank,
      },
      title: `MOVE ${player.ign} TO RANK #${targetRank}`,
      message: `Move ${player.ign} from Rank #${currentRank} to Rank #${targetRank}?`
    });
    setReason(`Moved ${player.ign} to Rank #${targetRank} via drag & drop.`);
  };

  const handleDropOnPlayer = (e, targetPlayer, targetRank) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverRank(null);
    if (!draggedPlayer) return;

    const { player: sourcePlayer, currentRank: sourceRank } = draggedPlayer;
    if (sourcePlayer._id === targetPlayer._id) return;

    setConfirmModal({
      open: true,
      action: 'SWAP',
      payload: {
        action: 'SWAP_PLAYERS',
        playerId: sourcePlayer._id,
        swapWithPlayerId: targetPlayer._id,
      },
      title: `SWAP ${sourcePlayer.ign} AND ${targetPlayer.ign}`,
      message: `Swap ${sourcePlayer.ign} (#${sourceRank}) with ${targetPlayer.ign} (#${targetRank})?`
    });
    setReason(`Swapped ${sourcePlayer.ign} (#${sourceRank}) with ${targetPlayer.ign} (#${targetRank}).`);
  };

  // Quick Action Buttons
  const handleQuickMove = (player, currentRank, targetRank) => {
    if (targetRank < 1 || targetRank > 10) return;
    setConfirmModal({
      open: true,
      action: 'MOVE',
      payload: {
        action: 'MOVE_TO_RANK',
        playerId: player._id,
        targetRank,
      },
      title: `MOVE ${player.ign} TO RANK #${targetRank}`,
      message: `Move ${player.ign} from Rank #${currentRank} to Rank #${targetRank}?`
    });
    setReason(`Admin moved ${player.ign} to Rank #${targetRank}.`);
  };

  const handleRemoveFromRank = (player, currentRank) => {
    setConfirmModal({
      open: true,
      action: 'REMOVE',
      payload: {
        action: 'REMOVE_FROM_RANK',
        playerId: player._id,
      },
      title: `REMOVE ${player.ign} FROM RANKING`,
      message: `Remove ${player.ign} from Rank #${currentRank}? They will become UNRANKED.`
    });
    setReason(`Removed ${player.ign} from Rank #${currentRank}.`);
  };

  const handleAddPlayerSubmit = async () => {
    if (!selectedPlayerId || !addReason.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await adminService.manualRankingUpdate({
        platform,
        action: 'ADD_TO_RANK',
        playerId: selectedPlayerId,
        targetRank: addModal.targetRank,
        reason: addReason.trim()
      });
      setAddModal({ open: false, targetRank: 1 });
      setSelectedPlayerId('');
      setAddReason('');
      fetchRankings();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add player to rank.');
    } finally {
      setAdding(false);
    }
  };

  // Build full 1-10 rank slots array
  const rankSlots = Array.from({ length: 10 }, (_, i) => {
    const rankNum = i + 1;
    const doc = rankings.find(r => r.rank === rankNum);
    return {
      rank: rankNum,
      players: doc ? doc.players : [],
      id: doc ? doc._id : `empty-${rankNum}`
    };
  });

  // Get unranked players for add picker
  const rankedPlayerIds = new Set(rankings.flatMap(r => r.players.map(p => p._id?.toString() || p.toString())));
  const unrankedPlayers = allPlayers.filter(p => !rankedPlayerIds.has(p._id.toString()));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">RANKING MANAGEMENT</h1>
          <p className="text-[#4A5D6E] text-xs font-semibold uppercase tracking-widest mt-1">
            Drag and drop players to swap or change ranks instantly
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchRankings} className="flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Platform Selector Tabs */}
      <div className="flex space-x-2">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-5 py-2.5 rounded-xl text-xs font-heading font-bold uppercase tracking-wider border transition-all ${
              platform === p
                ? 'bg-[#8BE3FF]/15 border-[#8BE3FF]/30 text-[#8BE3FF] shadow-[0_0_15px_rgba(139,227,255,0.1)]'
                : 'border-frost-50/5 text-[#4A5D6E] hover:border-frost-50/15 hover:text-[#F4FBFF]'
            }`}
          >
            {p} Leaderboard
          </button>
        ))}
      </div>

      {/* Rankings List with Drag and Drop */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-20 bg-frost-800/30 rounded-xl animate-pulse border border-frost-50/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {rankSlots.map(({ rank, players }) => {
            const isOver = dragOverRank === rank;
            const isFull = players.length >= 3;

            return (
              <Card
                key={rank}
                variant="default"
                className={`p-4 border transition-all duration-200 ${
                  isOver
                    ? 'border-[#8BE3FF] bg-[#8BE3FF]/10 shadow-[0_0_20px_rgba(139,227,255,0.15)] scale-[1.005]'
                    : 'border-frost-50/[0.06] hover:border-frost-50/20'
                }`}
                onDragOver={(e) => handleDragOver(e, rank)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDropOnRank(e, rank)}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  {/* Rank Badge */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <RankBadge rank={rank} size="md" />
                    <span className="text-[#4A5D6E] text-xs font-heading font-bold uppercase tracking-wider">
                      Rank #{rank}
                    </span>
                  </div>

                  {/* Players in this rank slot */}
                  <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0">
                    {players.length === 0 ? (
                      <span className="text-[#2A3D4E] text-xs italic font-heading uppercase tracking-wider py-1 px-3 border border-dashed border-frost-50/5 rounded-lg">
                        Empty Slot — Drop player here to assign #Rank {rank}
                      </span>
                    ) : (
                      players.map(player => (
                        <div
                          key={player._id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, player, rank)}
                          onDrop={(e) => handleDropOnPlayer(e, player, rank)}
                          className="group flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#06090F] border border-frost-50/10 hover:border-[#8BE3FF]/40 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-sm"
                        >
                          <Move className="w-3.5 h-3.5 text-[#4A5D6E] group-hover:text-[#8BE3FF] transition-colors flex-shrink-0" />
                          <div>
                            <p className="font-heading font-bold text-sm text-[#F4FBFF] uppercase tracking-wide leading-none">{player.ign}</p>
                            <p className="text-[#4A5D6E] text-[10px] font-mono mt-0.5">{player.pubgUid}</p>
                          </div>

                          {/* Quick Action Controls */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity ml-1 border-l border-frost-50/10 pl-2">
                            {rank > 1 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuickMove(player, rank, rank - 1); }}
                                className="p-1 rounded hover:bg-frost-50/10 text-[#4A5D6E] hover:text-[#8BE3FF] transition-colors"
                                title="Move Up"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {rank < 10 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleQuickMove(player, rank, rank + 1); }}
                                className="p-1 rounded hover:bg-frost-50/10 text-[#4A5D6E] hover:text-[#8BE3FF] transition-colors"
                                title="Move Down"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveFromRank(player, rank); }}
                              className="p-1 rounded hover:bg-red-950/40 text-[#4A5D6E] hover:text-red-400 transition-colors"
                              title="Remove from Rank"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Player to rank button */}
                  {!isFull && (
                    <button
                      onClick={() => { setAddModal({ open: true, targetRank: rank }); setSelectedPlayerId(''); setAddReason(''); setAddError(''); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-frost-50/5 hover:border-[#8BE3FF]/30 text-[#4A5D6E] hover:text-[#8BE3FF] text-xs font-heading font-semibold uppercase transition-all flex-shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Player</span>
                    </button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal for Drag & Drop / Quick Actions */}
      <Modal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, action: null, payload: null, title: '', message: '' })} title={confirmModal.title} maxWidth="max-w-md">
        <div className="space-y-4">
          <p className="text-[#8A9AAD] text-sm">{confirmModal.message}</p>

          <div>
            <label className="text-xs font-heading font-semibold text-[#4A5D6E] uppercase tracking-widest block mb-1">Reason for Adjustment (Required)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Winner of match #102 or manual re-tiering"
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setConfirmModal({ open: false, action: null, payload: null, title: '', message: '' })} className="flex-1">
              CANCEL
            </Button>
            <Button
              variant="primary"
              onClick={() => executeAdjustment({ ...confirmModal.payload, reason })}
              isLoading={saving}
              disabled={!reason.trim()}
              className="flex-1"
            >
              CONFIRM RANK CHANGE
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Player to Rank Modal */}
      <Modal isOpen={addModal.open} onClose={() => setAddModal({ open: false, targetRank: 1 })} title={`ADD PLAYER TO RANK #${addModal.targetRank}`} maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-heading font-semibold text-[#4A5D6E] uppercase tracking-widest block mb-1">Select Player</label>
            {unrankedPlayers.length === 0 ? (
              <p className="text-[#4A5D6E] text-xs italic">All registered players for {platform} are currently ranked.</p>
            ) : (
              <select
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#06090F] border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-[#8BE3FF]/40"
              >
                <option value="">-- Choose Unranked Player --</option>
                {unrankedPlayers.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.ign} ({p.pubgUid})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="text-xs font-heading font-semibold text-[#4A5D6E] uppercase tracking-widest block mb-1">Reason (Required)</label>
            <input
              value={addReason}
              onChange={e => setAddReason(e.target.value)}
              placeholder="e.g. Tournament winner addition"
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            />
          </div>

          {addError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>{addError}</span>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setAddModal({ open: false, targetRank: 1 })} className="flex-1">CANCEL</Button>
            <Button
              variant="primary"
              onClick={handleAddPlayerSubmit}
              isLoading={adding}
              disabled={!selectedPlayerId || !addReason.trim()}
              className="flex-1"
            >
              ADD TO RANK #{addModal.targetRank}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
