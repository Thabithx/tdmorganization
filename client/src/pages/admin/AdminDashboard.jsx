import React, { useState, useEffect } from 'react';
import { Users, Trophy, Swords, CreditCard, Flame, ShieldCheck, TrendingUp, Clock } from 'lucide-react';
import Card from '../../components/ui/Card';
import { formatAmount, formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <Card variant="default" className="p-5 border-frost-50/5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-secondary text-xs uppercase font-heading font-semibold tracking-widest mb-1">{label}</p>
        <p className={`font-heading text-2xl font-extrabold ${color || 'text-[#F4FBFF]'}`}>{value}</p>
      </div>
      <div className="w-10 h-10 rounded-xl bg-frost-800/60 border border-frost-50/5 flex items-center justify-center">
        <Icon className="w-5 h-5 text-secondary" />
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

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">ADMIN DASHBOARD</h1>
        <p className="text-secondary text-xs uppercase font-semibold tracking-widest mt-1">FROST Control Center</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Players" value={data?.totalPlayers ?? 0} />
        <StatCard icon={Trophy} label="Ranked Players" value={data?.rankedPlayers ?? 0} color="text-frost-50" />
        <StatCard icon={Clock} label="Pending Challenges" value={data?.pendingChallenges ?? 0} color="text-amber-300" />
        <StatCard icon={CreditCard} label="Pending Payments" value={data?.pendingPayments ?? 0} color="text-orange-300" />
        <StatCard icon={Flame} label="Active Matches" value={data?.activeMatches ?? 0} color="text-red-400" />
        <StatCard icon={ShieldCheck} label="Completed Matches" value={data?.completedMatches ?? 0} color="text-emerald-400" />
        <StatCard icon={Swords} label="Disputed Matches" value={data?.disputedMatches ?? 0} color="text-red-500" />
        <StatCard icon={TrendingUp} label="Unranked Players" value={data?.unrankedPlayers ?? 0} />
      </div>

      {/* Recent Matches */}
      <Card variant="default" className="border-frost-50/5 overflow-hidden">
        <div className="px-5 py-4 border-b border-frost-50/10 bg-frost-800/40">
          <h3 className="font-heading text-sm font-bold text-frost-100 uppercase tracking-widest">Recent Completed Matches</h3>
        </div>
        <div className="divide-y divide-frost-50/5">
          {data?.recentMatches?.length > 0 ? (
            data.recentMatches.map(match => (
              <div key={match._id} className="px-5 py-4 flex items-center justify-between hover:bg-frost-50/2 transition-colors">
                <div className="flex items-center space-x-3">
                  <Flame className="w-4 h-4 text-frost-50/50" />
                  <span className="font-heading text-sm font-bold text-[#F4FBFF] uppercase">
                    {match.challengerId?.ign} <span className="text-secondary">vs</span> {match.defenderId?.ign}
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold uppercase font-heading">→ {match.winnerId?.ign} WON</span>
                </div>
                <span className="text-secondary text-xs">{formatDate(match.matchCompletedAt)}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-secondary text-sm">No completed matches yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
