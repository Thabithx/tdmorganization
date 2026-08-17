import React, { useState } from 'react';
import { User, Edit3, Save, X, AlertTriangle } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { RankBadge, PlatformBadge } from '../components/ui/Badge';
import PlayerAvatar from '../components/player/PlayerAvatar';
import useAuth from '../hooks/useAuth';
import * as playerService from '../services/player.service';
import { formatDate } from '../utils/formatters';

const MyProfile = () => {
  const { user, profile, token, updateLocalProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ avatar: profile?.avatar || '', bio: profile?.bio || '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await playerService.updateProfile(formData);
      if (res.success) {
        updateLocalProfile(res.data);
        setSuccess('Profile updated successfully!');
        setEditing(false);
      } else {
        setError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ avatar: profile?.avatar || '', bio: profile?.bio || '' });
    setEditing(false);
    setError('');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Header */}
      <h1 className="text-3xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">MY PROFILE</h1>

      {/* Profile Card */}
      <Card variant="elevated" className="overflow-hidden border-frost-50/15">
        <div className="px-6 py-5 bg-frost-800/60 border-b border-frost-50/10 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-secondary" />
            <span className="font-heading text-sm font-bold uppercase text-frost-100 tracking-widest">Account Info</span>
          </div>
          {!editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)} className="flex items-center space-x-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>EDIT</span>
            </Button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar & Core Details */}
          <div className="flex items-center space-x-5">
            <PlayerAvatar profile={profile} size="xl" />
            <div className="space-y-2">
              <h2 className="font-heading text-2xl font-extrabold text-[#F4FBFF] uppercase tracking-wider">{profile?.ign}</h2>
              <div className="flex items-center space-x-2">
                <RankBadge rank={profile?.currentRank} size="sm" />
                <PlatformBadge platform={profile?.platform} />
              </div>
              <p className="text-secondary text-xs uppercase font-semibold tracking-widest">
                {user?.username} · {user?.email}
              </p>
            </div>
          </div>

          {/* Read-only details */}
          <div className="space-y-3 pt-2 border-t border-frost-50/5">
            <div className="flex justify-between py-2 border-b border-frost-50/5">
              <span className="text-secondary text-sm">PUBG UID</span>
              <span className="font-heading font-semibold text-[#F4FBFF] text-sm">{profile?.pubgUid}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-frost-50/5">
              <span className="text-secondary text-sm">Platform</span>
              <PlatformBadge platform={profile?.platform} />
            </div>
            <div className="flex justify-between py-2 border-b border-frost-50/5">
              <span className="text-secondary text-sm">Member Since</span>
              <span className="text-secondary text-sm">{formatDate(profile?.createdAt)}</span>
            </div>
          </div>

          {/* Editable fields */}
          {editing ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Avatar URL</label>
                <input
                  type="text"
                  value={formData.avatar}
                  onChange={e => setFormData(p => ({ ...p, avatar: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                  rows={3}
                  maxLength={200}
                  placeholder="Your competitive persona..."
                  className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all resize-none"
                />
                <p className="text-secondary/50 text-[10px]">{formData.bio.length}/200</p>
              </div>

              {error && (
                <div className="flex items-center space-x-2 p-3 rounded-lg bg-red-950/30 border border-red-500/20 text-red-300 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex space-x-3">
                <Button variant="secondary" size="md" onClick={handleCancel} className="flex-1 flex items-center justify-center space-x-1.5">
                  <X className="w-4 h-4" />
                  <span>CANCEL</span>
                </Button>
                <Button variant="primary" size="md" onClick={handleSave} isLoading={saving} className="flex-1 flex items-center justify-center space-x-1.5">
                  <Save className="w-4 h-4" />
                  <span>SAVE CHANGES</span>
                </Button>
              </div>
            </div>
          ) : (
            profile?.bio && (
              <div className="pt-2 border-t border-frost-50/5">
                <p className="text-secondary/80 text-sm italic">"{profile.bio}"</p>
              </div>
            )
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              ✓ {success}
            </div>
          )}
        </div>
      </Card>

      {/* Note about protected fields */}
      <Card variant="default" className="p-4 border-amber-500/10 bg-amber-950/10">
        <p className="text-secondary/70 text-xs leading-relaxed">
          <span className="text-amber-300 font-semibold">Note:</span> Your IGN, PUBG UID, and platform cannot be self-edited. Contact FROST administration if you need to make changes to these fields.
        </p>
      </Card>
    </div>
  );
};

export default MyProfile;
