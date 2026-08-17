import React, { useState, useEffect } from 'react';
import { Plus, Minus, ArrowUpDown, Save, AlertTriangle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { RankBadge, PlatformBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import * as adminService from '../../services/admin.service';

const PLATFORMS = ['MOBILE', 'IPAD', 'EMULATOR'];

const AdminRankings = () => {
  const [platform, setPlatform] = useState('MOBILE');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ action: 'ADD_TO_RANK', playerId: '', targetRank: '', swapWithPlayerId: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchRankings = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAdminRankings({ platform });
      if (res.success) setRankings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRankings(); }, [platform]);

  const handleSave = async () => {
    setSaving(true);
    setFormError('');
    try {
      await adminService.manualRankingUpdate({ ...adjustForm, platform });
      setModalOpen(false);
      fetchRankings();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Manual update failed.');
    } finally {
      setSaving(false);
    }
  };

  const ACTIONS = ['ADD_TO_RANK', 'REMOVE_FROM_RANK', 'MOVE_TO_RANK', 'SWAP_PLAYERS'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">RANKING MANAGEMENT</h1>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)} className="flex items-center space-x-1.5">
          <ArrowUpDown className="w-3.5 h-3.5" />
          <span>MANUAL ADJUSTMENT</span>
        </Button>
      </div>

      {/* Platform Tabs */}
      <div className="flex space-x-2">
        {PLATFORMS.map(p => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-4 py-2 rounded-lg text-xs font-heading font-semibold uppercase border transition-all ${
              platform === p ? 'bg-frost-50/10 border-frost-50/30 text-frost-100' : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Rankings grid */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => <div key={i} className="h-16 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {rankings.map(rankDoc => (
            <Card key={rankDoc._id} variant="default" className="p-4 border-frost-50/5">
              <div className="flex items-center space-x-5">
                <RankBadge rank={rankDoc.rank} size="md" />
                <div className="flex-1 flex flex-wrap gap-3">
                  {rankDoc.players.length === 0 ? (
                    <span className="text-secondary/50 text-xs italic uppercase tracking-wider">VACANT</span>
                  ) : (
                    rankDoc.players.map(player => (
                      <div key={player._id} className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-frost-800/60 border border-frost-50/5">
                        <span className="font-heading font-bold text-sm text-[#F4FBFF] uppercase">{player.ign}</span>
                        <span className="text-secondary text-xs">{player.pubgUid}</span>
                      </div>
                    ))
                  )}
                </div>
                <div className="text-secondary/40 text-xs font-heading font-semibold uppercase tracking-wider">
                  {rankDoc.players.length}/3
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Manual Adjustment Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="MANUAL RANKING ADJUSTMENT" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Action</label>
            <select
              value={adjustForm.action}
              onChange={e => setAdjustForm(p => ({ ...p, action: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            >
              {ACTIONS.map(a => <option key={a} value={a} className="bg-[#0B101A]">{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Player ID</label>
            <input
              value={adjustForm.playerId}
              onChange={e => setAdjustForm(p => ({ ...p, playerId: e.target.value }))}
              placeholder="MongoDB ObjectId of the player"
              className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            />
          </div>

          {['ADD_TO_RANK', 'MOVE_TO_RANK'].includes(adjustForm.action) && (
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Target Rank (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={adjustForm.targetRank}
                onChange={e => setAdjustForm(p => ({ ...p, targetRank: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
              />
            </div>
          )}

          {adjustForm.action === 'SWAP_PLAYERS' && (
            <div className="space-y-1.5">
              <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Swap With Player ID</label>
              <input
                value={adjustForm.swapWithPlayerId}
                onChange={e => setAdjustForm(p => ({ ...p, swapWithPlayerId: e.target.value }))}
                placeholder="MongoDB ObjectId of the other player"
                className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Reason (Required)</label>
            <textarea
              value={adjustForm.reason}
              onChange={e => setAdjustForm(p => ({ ...p, reason: e.target.value }))}
              rows={2}
              placeholder="Document the reason for this manual adjustment..."
              className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 resize-none"
            />
          </div>

          {formError && (
            <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <Button variant="secondary" size="md" onClick={() => setModalOpen(false)} className="flex-1">CANCEL</Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSave}
              isLoading={saving}
              disabled={!adjustForm.playerId || !adjustForm.reason}
              className="flex-1 flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>APPLY</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminRankings;
