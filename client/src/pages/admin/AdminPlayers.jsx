import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, ShieldCheck, UserX, UserCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { RankBadge, PlatformBadge } from '../../components/ui/Badge';
import PlayerAvatar from '../../components/player/PlayerAvatar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import * as adminService from '../../services/admin.service';

const AdminPlayers = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null, player: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlayers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (platform !== 'ALL') params.platform = platform;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await adminService.getAdminPlayers(params);
      if (res.success) setPlayers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchPlayers, 300);
    return () => clearTimeout(t);
  }, [search, platform, statusFilter]);

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await adminService.suspendPlayer(confirmDialog.player._id);
      fetchPlayers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, action: null, player: null });
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await adminService.restorePlayer(confirmDialog.player._id);
      fetchPlayers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    } finally {
      setActionLoading(false);
      setConfirmDialog({ open: false, action: null, player: null });
    }
  };

  const PLATFORMS = ['ALL', 'MOBILE', 'IPAD', 'EMULATOR'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">PLAYER MANAGEMENT</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search IGN or UID..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all"
          />
        </div>
        <div className="flex space-x-2">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase border transition-all ${
                platform === p ? 'bg-frost-50/10 border-frost-50/30 text-frost-100' : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex space-x-2">
          {['ALL', 'ACTIVE', 'SUSPENDED'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase border transition-all ${
                statusFilter === s ? 'bg-frost-50/10 border-frost-50/30 text-frost-100' : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Player Table */}
      <Card variant="default" className="overflow-hidden border-frost-50/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-frost-50/10 bg-frost-800/40 text-secondary text-xs uppercase font-heading tracking-widest">
                <th className="px-4 py-3 text-left">Player</th>
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Platform</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-frost-50/5">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-3">
                      <div className="h-8 bg-frost-800/40 rounded animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-secondary text-sm">
                    No players found.
                  </td>
                </tr>
              ) : (
                players.map(player => (
                  <tr key={player._id} className="hover:bg-frost-50/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-3">
                        <PlayerAvatar profile={player} size="sm" />
                        <div>
                          <p className="font-heading font-bold text-[#F4FBFF] uppercase text-sm">{player.ign}</p>
                          <p className="text-secondary text-xs">{player.pubgUid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RankBadge rank={player.currentRank} size="sm" /></td>
                    <td className="px-4 py-3"><PlatformBadge platform={player.platform} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-heading font-semibold uppercase ${player.status === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {player.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {player.status === 'ACTIVE' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setConfirmDialog({ open: true, action: 'suspend', player })}
                          className="flex items-center space-x-1"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>SUSPEND</span>
                        </Button>
                      ) : (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => setConfirmDialog({ open: true, action: 'restore', player })}
                          className="flex items-center space-x-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>RESTORE</span>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, action: null, player: null })}
        onConfirm={confirmDialog.action === 'suspend' ? handleSuspend : handleRestore}
        title={confirmDialog.action === 'suspend' ? 'SUSPEND PLAYER' : 'RESTORE PLAYER'}
        message={
          confirmDialog.action === 'suspend'
            ? `Are you sure you want to suspend ${confirmDialog.player?.ign}? They will lose access to the platform.`
            : `Restore ${confirmDialog.player?.ign}'s account access?`
        }
        confirmText={confirmDialog.action === 'suspend' ? 'SUSPEND' : 'RESTORE'}
        variant={confirmDialog.action === 'suspend' ? 'danger' : 'success'}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default AdminPlayers;
