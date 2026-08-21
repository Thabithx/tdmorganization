import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, User, Trophy, Swords, CreditCard, StickyNote,
  ShieldAlert, ShieldCheck, Plus, Trash2, ChevronDown, ChevronUp,
  Flame, UserX, UserCheck, ExternalLink
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { RankBadge, PlatformBadge, StatusBadge } from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { formatAmount, formatDate, formatWinRate, formatRank } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';
import PlayerAvatar from '../../components/player/PlayerAvatar';

const Section = ({ title, icon: Icon, children }) => (
  <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
    <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#8BE3FF]/60" />
      <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </Card>
);

const StatItem = ({ label, value, color }) => (
  <div className="text-center p-3 rounded-lg bg-frost-800/20 border border-frost-50/5">
    <p className={`font-heading text-xl font-extrabold ${color || 'text-[#F4FBFF]'}`}>{value ?? '—'}</p>
    <p className="text-[#4A5D6E] text-[10px] uppercase font-semibold tracking-widest mt-0.5">{label}</p>
  </div>
);

export default function AdminPlayerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Notes
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  // Suspend/Restore
  const [confirmDialog, setConfirmDialog] = useState({ open: false, action: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

  // Edit modal
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ ign: '', bio: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Expanded sections
  const [showMatches, setShowMatches] = useState(true);
  const [showChallenges, setShowChallenges] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAdminPlayerById(id);
      if (res.success) {
        setData(res.data);
        setEditForm({ ign: res.data.profile.ign, bio: res.data.profile.bio || '' });
      } else {
        setError('Player not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load player.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleAddNote = async () => {
    if (!noteContent.trim()) return;
    setAddingNote(true);
    setNoteError('');
    try {
      await adminService.addPlayerNote(id, noteContent.trim());
      setNoteContent('');
      fetchData();
    } catch (err) {
      setNoteError(err.response?.data?.message || 'Failed to add note.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    setDeletingNoteId(noteId);
    try {
      await adminService.deletePlayerNote(id, noteId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleSuspend = async () => {
    setActionLoading(true);
    try {
      await adminService.suspendPlayer(id, suspendReason);
      setSuspendReason('');
      setConfirmDialog({ open: false, action: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await adminService.restorePlayer(id);
      setConfirmDialog({ open: false, action: null });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      await adminService.updateAdminPlayer(id, { bio: editForm.bio });
      setEditModal(false);
      fetchData();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update.');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 rounded-xl bg-frost-800/20 animate-pulse border border-frost-50/5" />
      ))}
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <p className="text-red-400 font-heading text-sm uppercase">{error}</p>
      <Button variant="secondary" onClick={() => navigate('/admin/players')} size="sm">← Back to Players</Button>
    </div>
  );

  const { profile, currentRank, stats, challengesCreated = [], challengesReceived = [], matches = [], payments = [], rankHistory = [] } = data;
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const totalMatches = wins + losses;

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/players')}
          className="flex items-center gap-2 text-[#4A5D6E] hover:text-[#8BE3FF] text-xs font-heading font-semibold uppercase tracking-widest transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Players
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditModal(true)}>Edit Profile</Button>
          {profile.status === 'ACTIVE' ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDialog({ open: true, action: 'suspend' })}
              className="flex items-center gap-1.5"
            >
              <UserX className="w-3.5 h-3.5" />
              SUSPEND
            </Button>
          ) : (
            <Button
              variant="success"
              size="sm"
              onClick={() => setConfirmDialog({ open: true, action: 'restore' })}
              className="flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              RESTORE
            </Button>
          )}
        </div>
      </div>

      {/* Identity Card */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative flex-shrink-0">
            <PlayerAvatar profile={profile} size="lg" />
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#06090F] ${profile.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="font-heading text-xl font-black text-[#F4FBFF] uppercase tracking-wider">{profile.ign}</h1>
              <PlatformBadge platform={profile.platform} />
              <span className={`text-xs font-heading font-semibold uppercase px-2 py-0.5 rounded border ${
                profile.status === 'ACTIVE' ? 'text-emerald-300 border-emerald-500/20 bg-emerald-950/30'
                : 'text-red-300 border-red-500/20 bg-red-950/30'
              }`}>
                {profile.status}
              </span>
            </div>
            <p className="text-[#4A5D6E] text-xs font-mono mb-1">UID: {profile.pubgUid}</p>
            {profile.bio && <p className="text-[#8A9AAD] text-sm">{profile.bio}</p>}
          </div>
          <div className="flex flex-col items-center gap-1">
            <RankBadge rank={currentRank} size="lg" />
            <span className="text-[#4A5D6E] text-[10px] uppercase font-semibold tracking-widest">
              {currentRank ? `Rank #${currentRank}` : 'Unranked'}
            </span>
          </div>
        </div>
        <div className="border-t border-frost-50/[0.06] px-5 py-3 flex flex-wrap gap-x-6 gap-y-1 bg-frost-800/10">
          <span className="text-[#4A5D6E] text-xs">
            Registered: <span className="text-[#8A9AAD]">{formatDate(profile.createdAt)}</span>
          </span>
          <span className="text-[#4A5D6E] text-xs">
            WhatsApp: <span className="text-[#8A9AAD] font-bold">{profile.whatsapp || 'None'}</span>
          </span>
          {currentRank && currentRank <= 10 && (
            <span className="text-[#4A5D6E] text-xs">
              Decline Rate: <span className={data.declinesLast7Days >= 3 ? 'text-rose-400 font-extrabold' : 'text-[#8BE3FF] font-bold'}>{data.declinesLast7Days} / 3 declines (rolling 7 days)</span>
            </span>
          )}
          <span className="text-[#4A5D6E] text-xs">
            DB ID: <span className="text-[#8A9AAD] font-mono text-[10px]">{profile._id}</span>
          </span>
        </div>
      </Card>

      {/* Stats Grid */}
      <Section title="Statistics" icon={BarChart3}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatItem label="Total Matches" value={totalMatches} />
          <StatItem label="Wins" value={wins} color="text-emerald-400" />
          <StatItem label="Losses" value={losses} color="text-red-400" />
          <StatItem label="Win Rate" value={formatWinRate(wins, losses)} color="text-[#8BE3FF]" />
          <StatItem label="Challenges Sent" value={challengesCreated.length} />
          <StatItem label="Challenges Received" value={challengesReceived.length} />
          <StatItem label="Payments" value={payments.length} />
          <StatItem label="Rank History" value={rankHistory.length} color="text-amber-300" />
        </div>
      </Section>

      {/* Match History */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <button
          className="w-full px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between hover:bg-frost-50/5 transition-colors"
          onClick={() => setShowMatches(!showMatches)}
        >
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-[#8BE3FF]/60" />
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Match History ({matches.length})</h3>
          </div>
          {showMatches ? <ChevronUp className="w-4 h-4 text-[#4A5D6E]" /> : <ChevronDown className="w-4 h-4 text-[#4A5D6E]" />}
        </button>
        {showMatches && (
          <div className="overflow-x-auto">
            {matches.length === 0 ? (
              <div className="p-8 text-center text-[#4A5D6E] text-sm">No matches yet.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-frost-50/[0.06] bg-frost-800/20 text-[#4A5D6E] uppercase font-heading tracking-widest">
                    <th className="px-4 py-3 text-left">Opponent</th>
                    <th className="px-4 py-3 text-left">Result</th>
                    <th className="px-4 py-3 text-left">Amount</th>
                    <th className="px-4 py-3 text-left">Ranks at Match</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-frost-50/5">
                  {matches.map(m => {
                    const isChallenger = m.challengerId?._id?.toString() === id || m.challengerId?.toString() === id;
                    const opponent = isChallenger ? m.defenderId : m.challengerId;
                    const won = m.winnerId?._id?.toString() === id || m.winnerId?.toString() === id;
                    const myRank = isChallenger ? m.challengerRankAtMatch : m.defenderRankAtMatch;
                    const oppRank = isChallenger ? m.defenderRankAtMatch : m.challengerRankAtMatch;

                    return (
                      <tr key={m._id} className="hover:bg-frost-50/[0.02] transition-colors">
                        <td className="px-4 py-3 font-heading font-bold text-[#F4FBFF] uppercase">
                          {opponent?.ign || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-heading font-bold uppercase ${won ? 'text-emerald-400' : 'text-red-400'}`}>
                            {won ? 'WIN' : 'LOSS'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#8A9AAD]">{formatAmount(m.challengeAmount)}</td>
                        <td className="px-4 py-3 text-[#4A5D6E]">
                          {myRank ? `#${myRank}` : 'UNR'} vs {oppRank ? `#${oppRank}` : 'UNR'}
                        </td>
                        <td className="px-4 py-3 text-[#4A5D6E]">{formatDate(m.matchCompletedAt)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/admin/matches/${m._id}`}
                            className="text-[#8BE3FF] hover:underline font-heading font-semibold uppercase text-[10px] flex items-center justify-end gap-1"
                          >
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Card>

      {/* Challenge History */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <button
          className="w-full px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between hover:bg-frost-50/5 transition-colors"
          onClick={() => setShowChallenges(!showChallenges)}
        >
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-[#8BE3FF]/60" />
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">
              Challenges ({challengesCreated.length + challengesReceived.length})
            </h3>
          </div>
          {showChallenges ? <ChevronUp className="w-4 h-4 text-[#4A5D6E]" /> : <ChevronDown className="w-4 h-4 text-[#4A5D6E]" />}
        </button>
        {showChallenges && (
          <div className="p-5 space-y-4">
            {[
              { label: 'Challenges Created', items: challengesCreated, isChallenger: true },
              { label: 'Challenges Received', items: challengesReceived, isChallenger: false },
            ].map(({ label, items, isChallenger }) => (
              <div key={label}>
                <p className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest mb-2">{label} ({items.length})</p>
                {items.length === 0 ? (
                  <p className="text-[#2A3D4E] text-xs italic">None.</p>
                ) : (
                  <div className="space-y-1.5">
                    {items.slice(0, 10).map(c => (
                      <div key={c._id} className="flex items-center justify-between p-2.5 rounded-lg bg-frost-800/20 border border-frost-50/5">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[#F4FBFF] font-heading font-bold uppercase text-xs truncate">
                            vs {isChallenger ? c.defenderId?.ign : c.challengerId?.ign}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-[#8A9AAD] text-xs">{formatAmount(c.challengeAmount)}</span>
                          <Link to={`/admin/challenges/${c._id}`} className="text-[#8BE3FF] text-[10px] font-heading font-semibold uppercase hover:underline">
                            View
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Admin Notes */}
      <Section title="Admin Notes (Private)" icon={StickyNote}>
        <div className="space-y-3">
          {(profile.adminNotes || []).length === 0 ? (
            <p className="text-[#2A3D4E] text-xs italic">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {profile.adminNotes.map(note => (
                <div key={note._id} className="flex items-start justify-between gap-3 p-3 rounded-lg bg-amber-950/20 border border-amber-500/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-[#F4FBFF] text-sm leading-relaxed">{note.content}</p>
                    <p className="text-[#4A5D6E] text-[10px] mt-1">
                      {note.adminId?.username || 'Admin'} · {formatDate(note.createdAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    disabled={deletingNoteId === note._id}
                    className="text-red-500/50 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add note */}
          <div className="flex gap-2 mt-3">
            <input
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
              placeholder="Add private admin note..."
              className="flex-1 px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 placeholder-[#2A3D4E] transition-all"
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddNote}
              isLoading={addingNote}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>
          {noteError && <p className="text-red-400 text-xs">{noteError}</p>}
        </div>
      </Section>

      {/* Rank History */}
      {rankHistory.length > 0 && (
        <Section title="Ranking History" icon={Trophy}>
          <div className="space-y-1.5">
            {rankHistory.slice(0, 15).map(h => (
              <div key={h._id} className="flex items-center justify-between p-2.5 rounded-lg bg-frost-800/20 border border-frost-50/5 text-xs">
                <div className="flex items-center gap-3">
                  <span className="text-[#4A5D6E]">
                    {h.previousRank ? `#${h.previousRank}` : 'Unranked'} →{' '}
                    <span className="text-[#8BE3FF] font-bold">
                      {h.newRank ? `#${h.newRank}` : 'Unranked'}
                    </span>
                  </span>
                  <span className="text-[#2A3D4E] uppercase font-heading font-semibold">{h.reason?.replace(/_/g, ' ')}</span>
                </div>
                <span className="text-[#2A3D4E]">{formatDate(h.createdAt)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Edit Modal */}
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="EDIT PLAYER PROFILE" maxWidth="max-w-md">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-heading font-semibold text-[#4A5D6E] uppercase tracking-widest block mb-1">Bio</label>
            <textarea
              value={editForm.bio}
              onChange={e => setEditForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 resize-none"
            />
          </div>
          {editError && <p className="text-red-400 text-xs">{editError}</p>}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setEditModal(false)} className="flex-1">CANCEL</Button>
            <Button variant="primary" onClick={handleEdit} isLoading={editLoading} className="flex-1">SAVE</Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Confirm */}
      <Modal
        isOpen={confirmDialog.open && confirmDialog.action === 'suspend'}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        title="SUSPEND PLAYER"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/15">
            <p className="text-red-300 text-sm font-semibold">
              Suspending <span className="text-[#F4FBFF] font-bold">{profile.ign}</span> will prevent them from creating or accepting challenges.
            </p>
          </div>
          <div>
            <label className="text-xs font-heading font-semibold text-[#4A5D6E] uppercase tracking-widest block mb-1">Reason (optional)</label>
            <input
              value={suspendReason}
              onChange={e => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmDialog({ open: false, action: null })} className="flex-1">CANCEL</Button>
            <Button variant="danger" onClick={handleSuspend} isLoading={actionLoading} className="flex-1">SUSPEND</Button>
          </div>
        </div>
      </Modal>

      {/* Restore Confirm */}
      <ConfirmDialog
        isOpen={confirmDialog.open && confirmDialog.action === 'restore'}
        onClose={() => setConfirmDialog({ open: false, action: null })}
        onConfirm={handleRestore}
        title="RESTORE PLAYER"
        message={`Restore ${profile.ign}'s account access? They will be able to create and accept challenges again.`}
        confirmText="RESTORE"
        variant="success"
        isLoading={actionLoading}
      />
    </div>
  );
}
