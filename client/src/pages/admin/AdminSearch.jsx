import React, { useState, useEffect } from 'react';
import { Search, Users, Swords, Flame, CreditCard, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../../components/ui/Card';
import { PlatformBadge, StatusBadge } from '../../components/ui/Badge';
import { formatAmount, formatDate } from '../../utils/formatters';
import * as adminService from '../../services/admin.service';

const ResultSection = ({ icon: Icon, title, items, emptyMsg, renderItem }) => (
  <div>
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-[#8BE3FF]/60" />
      <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">
        {title} <span className="text-[#4A5D6E]">({items.length})</span>
      </h3>
    </div>
    {items.length === 0 ? (
      <p className="text-[#2A3D4E] text-xs italic pl-6">{emptyMsg}</p>
    ) : (
      <div className="space-y-1.5">
        {items.map(renderItem)}
      </div>
    )}
  </div>
);

export default function AdminSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminService.globalSearch(query.trim());
        if (res.success) {
          setResults(res.data);
          setSearched(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const total = results
    ? (results.players?.length || 0) + (results.challenges?.length || 0) + (results.matches?.length || 0) + (results.payments?.length || 0)
    : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="font-heading text-xl font-black text-[#F4FBFF] uppercase tracking-wider mb-1">Global Search</h1>
        <p className="text-[#4A5D6E] text-xs">Search players, challenges, matches, and payments across the entire platform.</p>
      </div>

      {/* Search Box */}
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${loading ? 'text-[#8BE3FF]' : 'text-[#4A5D6E]'}`} />
        <input
          id="admin-global-search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by IGN, UID, Player ID, Challenge ID, Match ID, PayHere Order ID..."
          className="w-full pl-12 pr-4 py-4 rounded-xl bg-[#06090F] border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-[#8BE3FF]/40 focus:shadow-[0_0_20px_rgba(139,227,255,0.05)] transition-all placeholder-[#2A3D4E]"
          autoFocus
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#8BE3FF]/30 border-t-[#8BE3FF] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Hint tags */}
      <div className="flex flex-wrap gap-2">
        {['IGN', 'PUBG UID', 'Player ID', 'Challenge ID', 'Match ID', 'PayHere Order'].map(hint => (
          <span key={hint} className="px-2 py-1 rounded-full bg-frost-800/30 border border-frost-50/5 text-[#2A3D4E] text-[10px] font-heading font-semibold uppercase">
            {hint}
          </span>
        ))}
      </div>

      {/* Results */}
      {searched && results && (
        <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center justify-between">
            <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Results</h3>
            <span className="text-[#4A5D6E] text-xs">{total} found for "{query}"</span>
          </div>
          {total === 0 ? (
            <div className="p-8 text-center text-[#4A5D6E] text-sm">No results found.</div>
          ) : (
            <div className="p-5 space-y-6 divide-y divide-frost-50/5">
              {/* Players */}
              {results.players?.length > 0 && (
                <div className="pt-4 first:pt-0">
                  <ResultSection
                    icon={Users}
                    title="Players"
                    items={results.players}
                    emptyMsg="No players found."
                    renderItem={player => (
                      <div key={player._id} className="flex items-center justify-between p-3 rounded-lg bg-frost-800/20 border border-frost-50/5 hover:bg-frost-50/[0.02] transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-frost-800/40 border border-frost-50/10 flex items-center justify-center">
                            <span className="text-[#8BE3FF] text-sm font-bold font-heading">{player.ign?.[0]}</span>
                          </div>
                          <div>
                            <p className="font-heading font-bold text-[#F4FBFF] uppercase text-sm">{player.ign}</p>
                            <p className="text-[#4A5D6E] text-[10px] font-mono">{player.pubgUid}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <PlatformBadge platform={player.platform} />
                          <Link to={`/admin/players/${player._id}`} className="text-[#8BE3FF] hover:underline text-[10px] font-heading font-semibold uppercase flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Challenges */}
              {results.challenges?.length > 0 && (
                <div className="pt-4">
                  <ResultSection
                    icon={Swords}
                    title="Challenges"
                    items={results.challenges}
                    emptyMsg="No challenges."
                    renderItem={c => (
                      <div key={c._id} className="flex items-center justify-between p-3 rounded-lg bg-frost-800/20 border border-frost-50/5 hover:bg-frost-50/[0.02] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <Swords className="w-4 h-4 text-[#4A5D6E] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-heading font-bold text-[#F4FBFF] uppercase text-sm truncate">
                              {c.challengerId?.ign} vs {c.defenderId?.ign}
                            </p>
                            <p className="text-[#4A5D6E] text-[10px] font-mono">{c._id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={c.status} />
                          <span className="text-[#8BE3FF] text-xs font-heading font-semibold">{formatAmount(c.challengeAmount)}</span>
                          <Link to={`/admin/challenges/${c._id}`} className="text-[#8BE3FF] hover:underline text-[10px] font-heading font-semibold uppercase flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Matches */}
              {results.matches?.length > 0 && (
                <div className="pt-4">
                  <ResultSection
                    icon={Flame}
                    title="Matches"
                    items={results.matches}
                    emptyMsg="No matches."
                    renderItem={m => (
                      <div key={m._id} className="flex items-center justify-between p-3 rounded-lg bg-frost-800/20 border border-frost-50/5 hover:bg-frost-50/[0.02] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <Flame className="w-4 h-4 text-[#4A5D6E] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-heading font-bold text-[#F4FBFF] uppercase text-sm truncate">
                              {m.challengerId?.ign} vs {m.defenderId?.ign}
                            </p>
                            <p className="text-[#4A5D6E] text-[10px] font-mono">{m._id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs font-heading font-semibold uppercase px-2 py-0.5 rounded border ${
                            m.resultStatus === 'COMPLETED' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-950/30'
                            : 'text-amber-300 border-amber-500/30 bg-amber-950/30'
                          }`}>{m.resultStatus}</span>
                          <Link to={`/admin/matches/${m._id}`} className="text-[#8BE3FF] hover:underline text-[10px] font-heading font-semibold uppercase flex items-center gap-1">
                            View <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Payments */}
              {results.payments?.length > 0 && (
                <div className="pt-4">
                  <ResultSection
                    icon={CreditCard}
                    title="Payments"
                    items={results.payments}
                    emptyMsg="No payments."
                    renderItem={p => (
                      <div key={p._id} className="flex items-center justify-between p-3 rounded-lg bg-frost-800/20 border border-frost-50/5 hover:bg-frost-50/[0.02] transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <CreditCard className="w-4 h-4 text-[#4A5D6E] flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-heading font-bold text-[#F4FBFF] uppercase text-sm truncate">
                              {p.payerId?.ign || 'Unknown'} — {formatAmount(p.amount)}
                            </p>
                            <p className="text-[#4A5D6E] text-[10px] font-mono">{p.payhereOrderId || p._id}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <StatusBadge status={p.status} />
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {!searched && !loading && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-[#2A3D4E] mx-auto mb-4" />
          <p className="text-[#4A5D6E] text-sm font-heading uppercase tracking-widest">Enter a search query above</p>
        </div>
      )}
    </div>
  );
}
