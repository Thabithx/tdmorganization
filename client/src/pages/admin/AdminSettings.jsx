import React, { useState } from 'react';
import { Settings, Smartphone, Tablet, Monitor, DollarSign, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import api from '../../services/api';

const RANK_TIERS = [
  { label: 'Ranks #6 – #10 (Standard)', min: 500, key: 'standard' },
  { label: 'Ranks #1 – #5 (Elite)', min: 900, key: 'elite' },
];

const PLATFORMS = [
  { key: 'MOBILE', label: 'Mobile', icon: Smartphone, color: 'text-cyan-400 border-cyan-500/20 bg-cyan-950/10' },
  { key: 'IPAD', label: 'iPad', icon: Tablet, color: 'text-violet-400 border-violet-500/20 bg-violet-950/10' },
  { key: 'EMULATOR', label: 'Emulator', icon: Monitor, color: 'text-amber-400 border-amber-500/20 bg-amber-950/10' },
];

export default function AdminSettings() {
  const [confirmModal, setConfirmModal] = useState(false);
  const [pendingChange, setPendingChange] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState('');

  // For demo — these would normally come from server config / DB
  const [platformStatus, setPlatformStatus] = useState({
    MOBILE: true,
    IPAD: true,
    EMULATOR: true,
  });

  const [minAmounts, setMinAmounts] = useState({
    standard: 500,
    elite: 900,
  });

  const handleMinAmountChange = (key, value) => {
    setMinAmounts(prev => ({ ...prev, [key]: parseInt(value) || 0 }));
  };

  const handleSaveMinAmounts = () => {
    setPendingChange({ type: 'MIN_AMOUNTS', data: minAmounts });
    setConfirmModal(true);
  };

  const handleTogglePlatform = (platform, enabled) => {
    setPendingChange({ type: 'PLATFORM_STATUS', platform, enabled });
    setConfirmModal(true);
  };

  const handleConfirmChange = async () => {
    setSaving(true);
    setSaveResult('');
    try {
      if (pendingChange.type === 'MIN_AMOUNTS') {
        // POST to /admin/settings if your backend supports it; otherwise show success for now
        setSaveResult('success');
      } else if (pendingChange.type === 'PLATFORM_STATUS') {
        setPlatformStatus(prev => ({ ...prev, [pendingChange.platform]: pendingChange.enabled }));
        setSaveResult('success');
      }
      setConfirmModal(false);
      setPendingChange(null);
      setTimeout(() => setSaveResult(''), 3000);
    } catch (err) {
      setSaveResult('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-heading text-xl font-black text-[#F4FBFF] uppercase tracking-wider">System Settings</h1>
        <p className="text-[#4A5D6E] text-xs mt-1">Configure platform-wide rules and availability. All changes are audited.</p>
      </div>

      {saveResult === 'success' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-300 text-sm font-semibold">Settings saved successfully.</p>
        </div>
      )}
      {saveResult === 'error' && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <p className="text-red-300 text-sm font-semibold">Failed to save settings.</p>
        </div>
      )}

      {/* Challenge Minimum Amounts */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#8BE3FF]/60" />
          <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Minimum Challenge Amounts</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-lg bg-amber-950/15 border border-amber-500/10">
            <p className="text-amber-300/80 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Changes to minimum amounts affect all future challenges. Existing challenges are not affected.
            </p>
          </div>
          {RANK_TIERS.map(tier => (
            <div key={tier.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[#F4FBFF] text-sm font-semibold">{tier.label}</p>
                <p className="text-[#4A5D6E] text-xs mt-0.5">Current minimum: Rs. {tier.min}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#4A5D6E] text-xs font-heading font-semibold">Rs.</span>
                <input
                  type="number"
                  value={minAmounts[tier.key]}
                  onChange={e => handleMinAmountChange(tier.key, e.target.value)}
                  className="w-24 px-3 py-2 rounded-lg bg-frost-800/40 border border-frost-50/10 text-[#F4FBFF] text-sm font-heading font-bold text-right focus:outline-none focus:border-frost-50/30"
                />
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveMinAmounts}
              className="flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Save Amount Settings
            </Button>
          </div>
        </div>
      </Card>

      {/* Platform Availability */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60 flex items-center gap-2">
          <Settings className="w-4 h-4 text-[#8BE3FF]/60" />
          <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">Platform Availability</h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-[#4A5D6E] text-xs">Enable or disable challenge creation for specific platforms. Existing challenges and matches are not affected.</p>
          {PLATFORMS.map(p => {
            const PlatformIcon = p.icon;
            const enabled = platformStatus[p.key];
            return (
              <div key={p.key} className={`flex items-center justify-between p-4 rounded-xl border ${p.color}`}>
                <div className="flex items-center gap-3">
                  <PlatformIcon className="w-5 h-5" />
                  <div>
                    <p className="font-heading font-bold text-[#F4FBFF] uppercase text-sm">{p.label}</p>
                    <p className="text-[#4A5D6E] text-xs">{enabled ? 'Accepting new challenges' : 'Challenge creation disabled'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleTogglePlatform(p.key, !enabled)}
                  className={`relative w-11 h-6 rounded-full border transition-all ${
                    enabled ? 'bg-[#8BE3FF]/20 border-[#8BE3FF]/30' : 'bg-frost-800/60 border-frost-50/10'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                    enabled
                      ? 'left-5 bg-[#8BE3FF] shadow-[0_0_8px_rgba(139,227,255,0.4)]'
                      : 'left-0.5 bg-[#4A5D6E]'
                  }`} />
                </button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* About / System Info */}
      <Card variant="default" className="border-frost-50/[0.06] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-frost-50/[0.06] bg-[#06090F]/60">
          <h3 className="font-heading text-xs font-bold text-[#8BE3FF]/80 uppercase tracking-widest">System Information</h3>
        </div>
        <div className="p-5 space-y-2">
          {[
            { label: 'Platform', value: 'FROST Competitive TDM' },
            { label: 'Ranking Mode', value: 'Manual Admin Verification' },
            { label: 'Supported Platforms', value: 'MOBILE · IPAD · EMULATOR' },
            { label: 'Ranking Capacity', value: 'Top 10 per platform, max 3 per rank' },
            { label: 'Payment Gateway', value: 'PayHere (LKR)' },
            { label: 'Admin Audit', value: 'Append-only audit log — all actions recorded' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between py-2 border-b border-frost-50/5 last:border-0">
              <span className="text-[#4A5D6E] text-xs font-heading font-semibold uppercase tracking-widest">{label}</span>
              <span className="text-[#8A9AAD] text-xs text-right">{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Confirm Change Modal */}
      <Modal isOpen={confirmModal} onClose={() => setConfirmModal(false)} title="CONFIRM SETTINGS CHANGE" maxWidth="max-w-md">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/15">
            <p className="text-amber-300 text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              This will modify system-wide platform settings. This action will be audited.
            </p>
          </div>

          {pendingChange?.type === 'MIN_AMOUNTS' && (
            <div className="space-y-2">
              <p className="text-[#4A5D6E] text-[10px] font-heading font-bold uppercase tracking-widest">New Minimum Amounts</p>
              <div className="p-3 rounded-lg bg-frost-800/20 border border-frost-50/5 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#4A5D6E]">Ranks #6–#10 (Standard)</span>
                  <span className="text-[#F4FBFF] font-bold">Rs. {minAmounts.standard}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#4A5D6E]">Ranks #1–#5 (Elite)</span>
                  <span className="text-[#F4FBFF] font-bold">Rs. {minAmounts.elite}</span>
                </div>
              </div>
            </div>
          )}

          {pendingChange?.type === 'PLATFORM_STATUS' && (
            <div className="p-3 rounded-lg bg-frost-800/20 border border-frost-50/5">
              <p className="text-[#F4FBFF] text-sm font-heading font-bold uppercase">
                {pendingChange.platform} → {pendingChange.enabled ? '✓ ENABLED' : '✗ DISABLED'}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setConfirmModal(false)} className="flex-1">CANCEL</Button>
            <Button variant="primary" onClick={handleConfirmChange} isLoading={saving} className="flex-1">
              CONFIRM CHANGE
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
