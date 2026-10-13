'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { User, MapPin, SlidersHorizontal, KeyRound, Download, Trash2, LogOut, ShieldCheck, ExternalLink, Camera, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useLocationStore, useUIStore, RADIUS_OPTIONS } from '@/store/useStore';
import { api, uploadImage } from '@/lib/client';
import type { MeDTO } from '@/types';

function Section({ icon: Icon, title, description, children }: { icon: typeof User; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-start gap-3 mb-4">
        <span className="w-9 h-9 rounded-full bg-community-50 text-community-600 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function SettingsClient({ initialMe, hasPassword }: { initialMe: MeDTO; hasPassword: boolean }) {
  const { update } = useSession();
  const location = useLocationStore((s) => s.location);
  const setLocation = useLocationStore((s) => s.setLocation);
  const setRadiusKm = useLocationStore((s) => s.setRadiusKm);
  const openPicker = useUIStore((s) => s.openLocationPicker);
  const [me, setMe] = useState(initialMe);

  const [name, setName] = useState(me.name);
  const [username, setUsername] = useState(me.username);
  const [bio, setBio] = useState(me.bio ?? '');
  const [avatar, setAvatar] = useState<string | null>(me.image ?? null);
  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      setAvatar(await uploadImage(file, 'avatar'));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSet, setPasswordSet] = useState(hasPassword);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const patchMe = async (body: Record<string, unknown>) => {
    const updated = await api<MeDTO>('/api/me', { method: 'PATCH', body });
    setMe(updated);
    return updated;
  };

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const updated = await patchMe({ name, username, bio, image: avatar });
      setUsername(updated.username);
      await update();
      toast.success('Profile saved');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreference = async (preferences: Partial<MeDTO['preferences']>) => {
    try {
      await patchMe({ preferences });
      if (preferences.radiusKm) setRadiusKm(preferences.radiusKm);
      toast.success('Saved');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const clearLocation = async () => {
    try {
      await patchMe({ location: null });
      setLocation(null);
      toast.success('Location removed');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      await api('/api/me/password', { body: { currentPassword: passwordSet ? currentPassword : undefined, newPassword } });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSet(true);
      toast.success('Password updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingPassword(false);
    }
  };

  const area = location?.place.label ?? me.place?.label;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 lg:py-8 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <Link href={`/u/${me.username}`} className="text-sm font-medium text-community-600 inline-flex items-center gap-1">
          View profile <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      {me.role === 'admin' && (
        <Link href="/admin" className="flex items-center gap-3 rounded-2xl bg-gray-900 text-white p-4 hover:bg-gray-800">
          <ShieldCheck className="w-6 h-6" />
          <span>
            <span className="block font-semibold">Moderation dashboard</span>
            <span className="block text-sm text-gray-300">Review reports and contact submissions</span>
          </span>
        </Link>
      )}

      <Section icon={User} title="Profile" description="This is how neighbors see you.">
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar name={name} image={avatar} size="xl" />
            <div className="flex flex-col gap-2">
              <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                {avatar ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadAvatar(e.target.files?.[0])} disabled={uploading} />
              </label>
              {avatar && (
                <button type="button" onClick={() => setAvatar(null)} className="text-xs text-gray-500 hover:text-red-600 text-left">
                  Remove photo
                </button>
              )}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="name">Display name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={60} required className="input-field" />
            </div>
            <div>
              <label className="label" htmlFor="username">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  pattern="[a-z0-9_]{3,20}"
                  title="3-20 characters: letters, numbers or underscores"
                  required
                  className="input-field pl-7"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bio">Bio</label>
            <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={300} placeholder="Tell neighbors a little about yourself" className="input-field resize-none" />
            <p className="text-xs text-gray-400 text-right">{bio.length}/300</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500 truncate">{me.email}</p>
            <Button type="submit" loading={savingProfile} disabled={uploading}>Save profile</Button>
          </div>
        </form>
      </Section>

      <Section icon={MapPin} title="Location" description="Only your neighborhood is ever shown, never your exact position.">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-gray-800">{area ?? <span className="text-gray-500">Not set</span>}</p>
          <div className="flex gap-2">
            {area && <Button variant="ghost" size="sm" onClick={clearLocation}>Remove</Button>}
            <Button variant="outline" size="sm" onClick={openPicker}>{area ? 'Change' : 'Set location'}</Button>
          </div>
        </div>
      </Section>

      <Section icon={SlidersHorizontal} title="Preferences">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-gray-900 text-sm">Default distance</p>
              <p className="text-xs text-gray-500">How far your feed and marketplace reach</p>
            </div>
            <select
              value={me.preferences.radiusKm}
              onChange={(e) => savePreference({ radiusKm: Number(e.target.value) })}
              className="input-field w-28"
            >
              {RADIUS_OPTIONS.map((km) => (
                <option key={km} value={km}>{km} km</option>
              ))}
            </select>
          </div>
          <label className="flex items-center justify-between gap-3 cursor-pointer">
            <span>
              <span className="block font-medium text-gray-900 text-sm">Emergency emails</span>
              <span className="block text-xs text-gray-500">Email me about critical alerts within 10 km. Password reset emails are always sent.</span>
            </span>
            <input
              type="checkbox"
              checked={me.preferences.emailNotifications}
              onChange={(e) => savePreference({ emailNotifications: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-community-600 focus:ring-community-500"
            />
          </label>
        </div>
      </Section>

      <Section icon={KeyRound} title={passwordSet ? 'Change password' : 'Set a password'} description={passwordSet ? undefined : 'You sign in with Google. Add a password to also sign in with your email.'}>
        <form onSubmit={changePassword} className="space-y-3">
          {passwordSet && (
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" autoComplete="current-password" required className="input-field" />
          )}
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 8 characters)" autoComplete="new-password" minLength={8} required className="input-field" />
          <div className="flex justify-end">
            <Button type="submit" variant="outline" loading={savingPassword}>Update password</Button>
          </div>
        </form>
      </Section>

      <Section icon={Download} title="Your data" description="Download a copy of everything you've shared on LocalVibe.">
        <a href="/api/me/export" className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export my data (JSON)
        </a>
      </Section>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1" onClick={() => signOut({ callbackUrl: '/' })}>
          <LogOut className="w-4 h-4 mr-2" /> Sign out
        </Button>
        <Button variant="ghost" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="w-4 h-4 mr-2" /> Delete account
        </Button>
      </div>

      {deleteOpen && <DeleteAccountModal username={me.username} hasPassword={passwordSet} onClose={() => setDeleteOpen(false)} />}
    </div>
  );
}

function DeleteAccountModal({ username, hasPassword, onClose }: { username: string; hasPassword: boolean; onClose: () => void }) {
  const setLocation = useLocationStore((s) => s.setLocation);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await api('/api/me', { method: 'DELETE', body: hasPassword ? { password: value } : { confirm: value } });
      setLocation(null);
      toast.success('Your account has been deleted');
      await signOut({ callbackUrl: '/' });
    } catch (e) {
      toast.error((e as Error).message);
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Delete your account?"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="emergency" onClick={confirmDelete} loading={loading} disabled={!value}>Delete forever</Button>
        </>
      }
    >
      <p className="text-sm text-gray-600 mb-3">
        This permanently deletes your profile, posts, comments, listings and messages. This cannot be undone.
      </p>
      <label className="label">{hasPassword ? 'Enter your password to confirm' : `Type "${username}" to confirm`}</label>
      <input
        type={hasPassword ? 'password' : 'text'}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete={hasPassword ? 'current-password' : 'off'}
        className="input-field"
      />
    </Modal>
  );
}
