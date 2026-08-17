import React, { useState, useEffect } from 'react';
import { Users, Trophy, Swords, CreditCard, Flame, ShieldCheck, TrendingUp, Clock, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { formatAmount, formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card variant="default" className="p-5 border-frost-50/5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[#4A5D6E] text-xs uppercase font-heading font-semibold tracking-widest mb-1">{label}</p>
        <p className={`font-heading text-2xl font-extrabold ${color || 'text-[#F4FBFF]'}`}>{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-frost-800/60 border border-frost-50/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#8BE3FF]" />
      </div>
    </div>
  </Card>
);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminService.getDashboard();
        if (res.success) setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-frost-800/40 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  const stats = data?.stats || {};
  const actionQueue = data?.actionQueue || [];
  const recentActivity = data?.recentActivity || [];
  const leaderboardPreview = data?.leaderboardPreview || {};

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">OPERATIONS DASHBOARD</h1>
        <p className="text-[#4A5D6E] text-xs uppercase font-semibold tracking-widest mt-1">FROST Competitive Control Center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Players" value={stats.totalPlayers ?? 0} />
        <StatCard icon={Trophy} label="Ranked Players" value={stats.rankedPlayers ?? 0} color="text-[#8BE3FF]" />
        <StatCard icon={Clock} label="Pending Challenges" value={stats.pendingChallenges ?? 0} color="text-amber-300" />
        <StatCard icon={CreditCard} label="Pending Payments" value={stats.pendingPayments ?? 0} color="text-orange-300" />
        <StatCard icon={Flame} label="Active Matches" value={stats.activeMatches ?? 0} color="text-red-400" />
        <StatCard icon={ShieldCheck} label="Completed Matches" value={stats.completedMatches ?? 0} color="text-emerald-400" />
        <StatCard icon={Swords} label="Disputed Matches" value={stats.disputedMatches ?? 0} color="text-red-500" />
        <StatCard icon={TrendingUp} label="Unranked Players" value={stats.unrankedPlayers ?? 0} />
      </div>

      {/* ACTION REQUIRED QUEUE */}
      <Card variant="default" className="border-frost-50/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-frost-50/10 bg-frost-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="font-heading text-sm font-bold text-frost-100 uppercase tracking-widest">ACTION REQUIRED ({actionQueue.length})</h3>
          </div>
        </div>
        <div className="divide-y divide-frost-50/5">
          {actionQueue.length > 0 ? (
            actionQueue.map((item, idx) => {
              const targetLink = item.linkType === 'match'
                ? `/admin/matches/${item.linkId}`
                : item.linkType === 'challenge'
                ? `/admin/challenges/${item.linkId}`
                : '/admin/payments';

              return (
                <div key={idx} className="px-5 py-4 flex items-center justify-between hover:bg-frost-50/2 transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className={`text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded border ${
                      item.urgency === 'HIGH' ? 'bg-red-950/40 border-red-500/30 text-red-300' : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                    }`}>
                      {item.type}
                    </span>
                    <span className="font-heading text-sm font-bold text-[#F4FBFF] uppercase">{item.label}</span>
                    <span className="text-xs text-[#4A5D6E]">{item.detail}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-[#4A5D6E] text-xs">{formatDate(item.timestamp)}</span>
                    <Link to={targetLink} className="text-[#8BE3FF] hover:underline text-xs font-heading font-bold uppercase flex items-center gap-1">
                      VIEW <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="px-5 py-8 text-center text-[#4A5D6E] text-sm">✓ No pending administrative actions.</div>
          )}
        </div>
      </Card>

      {/* PLATFORM LEADERBOARD PREVIEWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['MOBILE', 'IPAD', 'EMULATOR'].map(platform => (
          <Card key={platform} variant="default" className="border-frost-50/5 overflow-hidden">
            <div className="px-5 py-3 border-b border-frost-50/10 bg-frost-800/40">
              <h4 className="font-heading text-xs font-bold text-[#8BE3FF] uppercase tracking-widest">{platform} LEADERBOARD TOP 10</h4>
            </div>
            <div className="p-3 space-y-1.5">
              {(leaderboardPreview[platform] || []).map(row => (
                <div key={row.rank} className="flex items-center justify-between p-2 rounded bg-frost-800/20 text-xs">
                  <span className="font-heading font-bold text-frost-50 w-6">#{row.rank}</span>
                  <div className="flex-1 flex flex-wrap gap-1">
                    {row.players.map(p => (
                      <Link key={p._id} to={`/admin/players/${p._id}`} className="text-[#F4FBFF] hover:text-[#8BE3FF] font-heading font-semibold uppercase">
                        {p.ign}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {(!leaderboardPreview[platform] || leaderboardPreview[platform].length === 0) && (
                <div className="py-4 text-center text-[#4A5D6E] text-xs">No ranked players.</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* RECENT ADMINISTRATIVE ACTIVITY */}
      <Card variant="default" className="border-frost-50/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-frost-50/10 bg-frost-800/40">
          <h3 className="font-heading text-sm font-bold text-frost-100 uppercase tracking-widest">Recent Administrative Audit Trail</h3>
        </div>
        <div className="divide-y divide-frost-50/5">
          {recentActivity.length > 0 ? (
            recentActivity.map(log => (
              <div key={log._id} className="px-5 py-3 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-heading font-bold text-[#8BE3FF]">{log.adminId?.username || 'Admin'}</span>
                  <span className="text-[#F4FBFF] font-mono">{log.action}</span>
                  {log.reason && <span className="text-[#4A5D6E]">({log.reason})</span>}
                </div>
                <span className="text-[#4A5D6E]">{formatDate(log.createdAt)}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-6 text-center text-[#4A5D6E] text-sm">No activity recorded.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
