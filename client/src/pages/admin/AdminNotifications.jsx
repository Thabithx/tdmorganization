import React, { useState, useEffect } from 'react';
import { Bell, Send, User, Swords, Flame } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';
import api from '../../services/api';

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send notification modal
  const [sendModal, setSendModal] = useState(false);
  const [sendForm, setSendForm] = useState({ userId: '', type: 'ADMIN_MESSAGE', message: '' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState('');

  // Player search for send
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerResults, setPlayerResults] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [searchingPlayer, setSearchingPlayer] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/notifications');
      if (res.data.success) setNotifications(res.data.data || []);
    } catch (err) {
      console.error(err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  useEffect(() => {
    if (!playerSearch.trim()) { setPlayerResults([]); return; }
    const t = setTimeout(async () => {
      setSearchingPlayer(true);
      try {
        const res = await adminService.getAdminPlayers({ search: playerSearch });
        if (res.success) setPlayerResults(res.data.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setSearchingPlayer(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [playerSearch]);

  const handleSendNotification = async () => {
    if (!selectedPlayer || !sendForm.message.trim()) return;
    setSending(true);
    setSendError('');
    setSendSuccess('');
    try {
      await api.post('/admin/notifications/send', {
        userId: selectedPlayer.userId,
        type: sendForm.type,
        message: sendForm.message.trim(),
      });
      setSendSuccess(`Notification sent to ${selectedPlayer.ign}`);
      setSendForm({ userId: '', type: 'ADMIN_MESSAGE', message: '' });
      setSelectedPlayer(null);
      setPlayerSearch('');
      fetchNotifications();
      setTimeout(() => { setSendModal(false); setSendSuccess(''); }, 1500);
    } catch (err) {
      setSendError(err.response?.data?.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const NOTIFICATION_TYPES = [
    { value: 'ADMIN_MESSAGE', label: 'Admin Message' },
    { value: 'CHALLENGE_UPDATE', label: 'Challenge Update' },
    { value: 'MATCH_UPDATE', label: 'Match Update' },
    { value: 'RANKING_CHANGE', label: 'Ranking Change' },
    { value: 'PAYMENT_UPDATE', label: 'Payment Update' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-black text-[#F4FBFF] uppercase tracking-wider">Notifications</h1>
          <p className="text-[#4A5D6E] text-xs mt-1">View recent platform notifications and send messages to players.</p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => { setSendModal(true); setSendError(''); setSendSuccess(''); }}
          className="flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Send Notification
        </Button>
      </div>

      {/* Notification List */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60">
          <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Recent Notifications</h3>
        </div>
        <div className="divide-y divide-frost-50/5">
          {loading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-4 bg-frost-800/40 rounded animate-pulse mb-2 w-2/3" />
                <div className="h-3 bg-frost-800/20 rounded animate-pulse w-1/3" />
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-8 h-8 text-[#2A3D4E] mx-auto mb-3" />
              <p className="text-[#4A5D6E] text-xs font-heading uppercase tracking-widest">No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 50).map(n => (
              <div key={n._id} className="px-5 py-4 hover:bg-frost-50/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      n.type?.includes('CHALLENGE') ? 'bg-indigo-950/40 border border-indigo-500/20'
                      : n.type?.includes('MATCH') ? 'bg-amber-950/40 border border-amber-500/20'
                      : n.type?.includes('RANKING') ? 'bg-cyan-950/40 border border-cyan-500/20'
                      : 'bg-frost-800/40 border border-frost-50/10'
                    }`}>
                      {n.type?.includes('CHALLENGE') ? <Swords className="w-3.5 h-3.5 text-indigo-400" />
                       : n.type?.includes('MATCH') ? <Flame className="w-3.5 h-3.5 text-amber-400" />
                       : n.type?.includes('RANKING') ? <User className="w-3.5 h-3.5 text-cyan-400" />
                       : <Bell className="w-3.5 h-3.5 text-[#4A5D6E]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#F4FBFF] text-sm leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[#4A5D6E] text-[10px] font-heading font-semibold uppercase">{n.type?.replace(/_/g, ' ')}</span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8BE3FF]" />
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[#2A3D4E] text-[10px] flex-shrink-0">{formatDate(n.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Send Notification Modal */}
      <Modal isOpen={sendModal} onClose={() => setSendModal(false)} title="SEND NOTIFICATION" maxWidth="max-w-lg">
        <div className="space-y-4">
          {/* Player Search */}
          <div>
            <label className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest block mb-1">
              Recipient Player
            </label>
            {selectedPlayer ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                <div>
                  <p className="text-[#F4FBFF] font-heading font-bold uppercase text-sm">{selectedPlayer.ign}</p>
                  <p className="text-[#4A5D6E] text-[10px] font-mono">{selectedPlayer.pubgUid}</p>
                </div>
                <button
                  onClick={() => { setSelectedPlayer(null); setPlayerSearch(''); }}
                  className="text-[#4A5D6E] hover:text-red-400 text-xs font-heading font-semibold uppercase transition-colors"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  value={playerSearch}
                  onChange={e => setPlayerSearch(e.target.value)}
                  placeholder="Search by IGN..."
                  className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30"
                />
                {playerResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-[#06090F] border border-frost-50/10 shadow-xl z-10 max-h-48 overflow-y-auto">
                    {playerResults.map(p => (
                      <button
                        key={p._id}
                        onClick={() => { setSelectedPlayer(p); setPlayerSearch(''); setPlayerResults([]); }}
                        className="w-full px-3 py-2.5 text-left hover:bg-frost-50/5 transition-colors flex items-center justify-between"
                      >
                        <span className="text-[#F4FBFF] font-heading font-bold uppercase text-sm">{p.ign}</span>
                        <span className="text-[#4A5D6E] text-[10px]">{p.platform}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest block mb-1">Type</label>
            <select
              value={sendForm.type}
              onChange={e => setSendForm(f => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 appearance-none"
            >
              {NOTIFICATION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Message */}
          <div>
            <label className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest block mb-1">Message</label>
            <textarea
              value={sendForm.message}
              onChange={e => setSendForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Notification message..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 resize-none"
            />
          </div>

          {sendError && <p className="text-red-400 text-xs">{sendError}</p>}
          {sendSuccess && <p className="text-emerald-400 text-xs">{sendSuccess}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setSendModal(false)} className="flex-1">CANCEL</Button>
            <Button
              variant="primary"
              onClick={handleSendNotification}
              isLoading={sending}
              disabled={!selectedPlayer || !sendForm.message.trim()}
              className="flex-1 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> SEND
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
