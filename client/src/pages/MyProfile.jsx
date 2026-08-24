import React, { useState, useRef } from 'react';
import { User, Edit3, Save, X, AlertTriangle, Upload, Camera } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { RankBadge, PlatformBadge } from '../components/ui/Badge';
import PlayerAvatar from '../components/player/PlayerAvatar';
import useAuth from '../hooks/useAuth';
import * as playerService from '../services/player.service';
import { formatDate } from '../utils/formatters';

const MyProfile = () => {
  const { user, profile, updateLocalProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    pubgUid: profile?.pubgUid || '',
    avatar: profile?.avatar || '',
    whatsapp: profile?.whatsapp || '',
    tiktok: profile?.tiktok || '',
    instagram: profile?.instagram || '',
    yearsPlaying: profile?.yearsPlaying || 0,
    lookingFor: profile?.lookingFor || '',
    controlsLayout: profile?.controlsLayout || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarPosition, setAvatarPosition] = useState(profile?.avatarPosition || 'center top');
  const [controlsLayoutFile, setControlsLayoutFile] = useState(null);
  const [controlsLayoutPreview, setControlsLayoutPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef(null);
  const controlsLayoutInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarPosition('center center'); // auto-center on new upload
    setError('');
  };

  const handleControlsFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return; }
    setControlsLayoutFile(file);
    setControlsLayoutPreview(URL.createObjectURL(file));
    setError('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const fd = new FormData();
      fd.append('bio', formData.bio);
      fd.append('pubgUid', formData.pubgUid);
      fd.append('whatsapp', formData.whatsapp);
      fd.append('tiktok', formData.tiktok);
      fd.append('instagram', formData.instagram);
      fd.append('yearsPlaying', formData.yearsPlaying);
      fd.append('lookingFor', formData.lookingFor);
      fd.append('avatarPosition', avatarPosition);
      if (formData.avatar && !avatarFile) fd.append('avatar', formData.avatar);
      if (avatarFile) fd.append('avatarFile', avatarFile);
      if (formData.controlsLayout && !controlsLayoutFile) fd.append('controlsLayout', formData.controlsLayout);
      if (controlsLayoutFile) fd.append('controlsLayoutFile', controlsLayoutFile);

      const res = await playerService.updateProfile(fd);
      if (res.success) {
        updateLocalProfile(res.data);
        setFormData({
          bio: res.data.bio || '',
          pubgUid: res.data.pubgUid || '',
          avatar: res.data.avatar || '',
          whatsapp: res.data.whatsapp || '',
          tiktok: res.data.tiktok || '',
          instagram: res.data.instagram || '',
          yearsPlaying: res.data.yearsPlaying || 0,
          lookingFor: res.data.lookingFor || '',
          controlsLayout: res.data.controlsLayout || '',
        });
        setSuccess('Profile updated successfully!');
        setEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        setControlsLayoutFile(null);
        setControlsLayoutPreview(null);
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
    setFormData({
      bio: profile?.bio || '',
      pubgUid: profile?.pubgUid || '',
      avatar: profile?.avatar || '',
      whatsapp: profile?.whatsapp || '',
      tiktok: profile?.tiktok || '',
      instagram: profile?.instagram || '',
      yearsPlaying: profile?.yearsPlaying || 0,
      lookingFor: profile?.lookingFor || '',
      controlsLayout: profile?.controlsLayout || '',
    });
    setAvatarFile(null);
    setAvatarPreview(null);
    setControlsLayoutFile(null);
    setControlsLayoutPreview(null);
    setEditing(false);
    setError('');
  };

  const currentAvatar = avatarPreview || profile?.avatar;
  const currentControlsLayout = controlsLayoutPreview || profile?.controlsLayout;

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      <h1 className="text-3xl font-heading font-extrabold text-[#F4FBFF] uppercase tracking-wider">MY PROFILE</h1>

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
          {/* Avatar */}
          <div className="flex items-center space-x-5">
            <div className="relative flex-shrink-0">
              {currentAvatar ? (
                <img
                  src={currentAvatar}
                  alt={profile?.ign}
                  className="w-20 h-20 rounded-2xl object-contain bg-[#0B101A] border-2 border-frost-50/20"
                  style={{ objectPosition: avatarPosition }}
                  onError={(e) => { e.target.onerror = null; e.target.src = ''; }}
                />
              ) : (
                <PlayerAvatar profile={profile} size="xl" objectPosition={avatarPosition} />
              )}
              {editing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-frost-600 border-2 border-frost-900 flex items-center justify-center hover:bg-frost-500 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-frost-50" />
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
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

          {/* Read-only fields */}
          <div className="space-y-3 pt-2 border-t border-frost-50/5">
            <div className="flex justify-between py-2 border-b border-frost-50/5">
              <span className="text-secondary text-sm">Member Since</span>
              <span className="text-secondary text-sm">{formatDate(profile?.createdAt)}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-frost-50/5">
              <span className="text-secondary text-sm">Platform</span>
              <PlatformBadge platform={profile?.platform} />
            </div>
            {!editing && (
              <>
                <div className="flex justify-between py-2 border-b border-frost-50/5">
                  <span className="text-secondary text-sm">PUBG UID</span>
                  <span className="font-heading font-semibold text-[#F4FBFF] text-sm">{profile?.pubgUid}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-frost-50/5">
                  <span className="text-secondary text-sm">WhatsApp</span>
                  <span className="font-heading font-semibold text-[#F4FBFF] text-sm">{profile?.whatsapp || '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-frost-50/5">
                  <span className="text-secondary text-sm">Years Playing PUBG</span>
                  <span className="font-heading font-semibold text-[#F4FBFF] text-sm">{profile?.yearsPlaying || 0} years</span>
                </div>
                <div className="flex justify-between py-2 border-b border-frost-50/5">
                  <span className="text-secondary text-sm">Mood / Looking For</span>
                  <span className="font-heading font-semibold text-frost-50 text-sm uppercase tracking-wider">{profile?.lookingFor || 'Not Specified'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-frost-50/5">
                  <span className="text-secondary text-sm">Instagram</span>
                  <span className="font-heading font-semibold text-[#F4FBFF] text-sm">{profile?.instagram ? `@${profile.instagram}` : '—'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-frost-50/5">
                  <span className="text-secondary text-sm">TikTok</span>
                  <span className="font-heading font-semibold text-[#F4FBFF] text-sm">{profile?.tiktok ? `@${profile.tiktok}` : '—'}</span>
                </div>
              </>
            )}
          </div>

          {/* Editable fields */}
          {editing ? (
            <div className="space-y-4 pt-2">
              {/* Avatar upload hint */}
              {avatarFile && (
                <div className="text-xs text-emerald-400 flex items-center space-x-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>New photo selected: {avatarFile.name} — will upload on save</span>
                </div>
              )}

              {/* PUBG UID */}
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">
                  PUBG UID <span className="text-amber-400 normal-case font-normal">(editable — make sure it's correct)</span>
                </label>
                <input
                  type="text"
                  value={formData.pubgUid}
                  onChange={e => setFormData(p => ({ ...p, pubgUid: e.target.value }))}
                  placeholder="Your PUBG UID"
                  className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all font-mono"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">
                  WhatsApp Number <span className="text-[#8BE3FF] normal-case font-normal">(required)</span>
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={e => setFormData(p => ({ ...p, whatsapp: e.target.value }))}
                  placeholder="e.g. +94771234567"
                  className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all"
                />
              </div>

              {/* Years Playing & Looking For */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">
                    Years Playing PUBG
                  </label>
                  <input
                    type="number"
                    value={formData.yearsPlaying}
                    onChange={e => setFormData(p => ({ ...p, yearsPlaying: parseInt(e.target.value) || 0 }))}
                    placeholder="e.g. 3"
                    className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">
                    Looking For / Mood
                  </label>
                  <input
                    type="text"
                    value={formData.lookingFor}
                    onChange={e => setFormData(p => ({ ...p, lookingFor: e.target.value }))}
                    placeholder="e.g. TDM Partners, Competitions"
                    className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all"
                  />
                </div>
              </div>

              {/* Social Media Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">
                    Instagram Username
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={e => setFormData(p => ({ ...p, instagram: e.target.value }))}
                    placeholder="e.g. frost_player"
                    className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">
                    TikTok Username
                  </label>
                  <input
                    type="text"
                    value={formData.tiktok}
                    onChange={e => setFormData(p => ({ ...p, tiktok: e.target.value }))}
                    placeholder="e.g. frost_player"
                    className="w-full px-4 py-2.5 rounded-xl bg-frost-800/60 border border-frost-50/10 text-[#F4FBFF] text-sm focus:outline-none focus:border-frost-50/30 transition-all"
                  />
                </div>
              </div>

              {/* Bio */}
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

              {/* Alignment controls — only shown when there's an avatar */}
              {(currentAvatar || avatarFile) && (
                <div className="space-y-2">
                  <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest">Photo Alignment</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Top Left', val: 'left top' },
                      { label: 'Top Center', val: 'center top' },
                      { label: 'Top Right', val: 'right top' },
                      { label: 'Center Left', val: 'left center' },
                      { label: 'Center', val: 'center center' },
                      { label: 'Center Right', val: 'right center' },
                      { label: 'Bottom Left', val: 'left bottom' },
                      { label: 'Bottom Center', val: 'center bottom' },
                      { label: 'Bottom Right', val: 'right bottom' },
                    ].map(({ label, val }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAvatarPosition(val)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-heading uppercase tracking-wide transition-all ${
                          avatarPosition === val
                            ? 'bg-frost-50/20 border border-frost-50/40 text-frost-50'
                            : 'bg-frost-800/40 border border-frost-50/10 text-secondary hover:border-frost-50/20'
                        }`}
                      >{label}</button>
                    ))}
                  </div>
                  <p className="text-secondary/40 text-[10px]">Select which part of your photo to show</p>
                </div>
              )}

              {/* Controls Layout Upload */}
              <div className="space-y-2 pt-2 border-t border-frost-50/5">
                <label className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest block">
                  Controls Layout Picture
                </label>
                {currentControlsLayout ? (
                  <div className="relative rounded-xl overflow-hidden bg-[#0B101A] border border-frost-50/10 max-h-48 max-w-md flex items-center justify-center">
                    <img src={currentControlsLayout} alt="Controls Layout" className="w-full h-full object-contain max-h-48" />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-frost-50/20 text-center text-xs text-secondary/60">
                    No Controls Layout uploaded yet
                  </div>
                )}
                <div className="flex items-center space-x-2 pt-1">
                  <Button type="button" variant="secondary" size="sm" onClick={() => controlsLayoutInputRef.current?.click()} className="flex items-center space-x-1">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{currentControlsLayout ? 'CHANGE PHOTO' : 'UPLOAD PHOTO'}</span>
                  </Button>
                  <input ref={controlsLayoutInputRef} type="file" accept="image/*" onChange={handleControlsFileChange} className="hidden" />
                  {controlsLayoutFile && (
                    <span className="text-[10px] text-emerald-400">Selected: {controlsLayoutFile.name}</span>
                  )}
                </div>
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
            <div className="space-y-4">
              {profile?.bio && (
                <div className="pt-2 border-t border-frost-50/5">
                  <p className="text-secondary/80 text-sm italic">"{profile.bio}"</p>
                </div>
              )}
              {profile?.controlsLayout && (
                <div className="pt-4 border-t border-frost-50/5 space-y-2">
                  <span className="text-xs font-heading font-semibold text-secondary uppercase tracking-widest block">Controls Layout</span>
                  <div className="rounded-xl overflow-hidden bg-[#0B101A] border border-frost-50/10 max-w-md max-h-56 flex items-center justify-center">
                    <img src={profile.controlsLayout} alt={`${profile.ign}'s Controls Layout`} className="w-full h-full object-contain max-h-56" />
                  </div>
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
              ✓ {success}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MyProfile;
