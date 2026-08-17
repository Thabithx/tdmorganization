import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search } from 'lucide-react';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import { formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');

  const ACTIONS = [
    'ALL', 'MATCH_RESULT_CONFIRMED', 'PLAYER_SUSPENDED', 'PLAYER_RESTORED',
    'PLAYER_UPDATED', 'PAYMENT_CONFIRMED', 'CHALLENGE_STATUS_UPDATED',
    'ADMIN_RANKING_ADJUSTMENT'
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = actionFilter && actionFilter !== 'ALL' ? { action: actionFilter } : {};
      const res = await adminService.getAuditLogs(params);
      if (res.success) setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ShieldAlert className="w-6 h-6 text-red-400" />
        <h1 className="text-2xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">AUDIT LOGS</h1>
      </div>

      {/* Action Filters */}
      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        {ACTIONS.map(a => (
          <button
            key={a}
            onClick={() => setActionFilter(a === 'ALL' ? '' : a)}
            className={`px-3 py-1.5 rounded-lg text-xs font-heading font-semibold uppercase border transition-all ${
              (actionFilter === a || (!actionFilter && a === 'ALL'))
                ? 'bg-frost-50/10 border-frost-50/30 text-frost-100'
                : 'border-frost-50/5 text-secondary hover:border-frost-50/15'
            }`}
          >
            {a.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => <div key={i} className="h-16 bg-frost-800/40 rounded-xl animate-pulse border border-frost-50/5" />)}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState iconName="ShieldAlert" title="NO AUDIT LOGS" message="No admin actions have been logged yet." />
      ) : (
        <Card variant="default" className="overflow-hidden border-frost-50/5">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-frost-50/10 bg-frost-800/40 text-secondary text-xs uppercase font-heading tracking-widest">
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Admin</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-frost-50/5">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-frost-50/2 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-heading text-xs font-bold uppercase text-frost-50 bg-frost-800/60 border border-frost-50/10 px-2 py-0.5 rounded">
                        {log.action?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-heading font-bold text-[#F4FBFF] text-xs uppercase">
                      {log.adminId?.username || '—'}
                    </td>
                    <td className="px-4 py-3 text-secondary text-xs font-mono">
                      {log.targetEntity ? `${log.targetEntity}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-secondary text-xs max-w-xs truncate">
                      {log.reason || '—'}
                    </td>
                    <td className="px-4 py-3 text-secondary text-xs whitespace-nowrap">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdminAuditLogs;
