'use client';

import { useEffect, useState } from 'react';
import { Phone, AlertTriangle, ShieldAlert, Plus, Info, HeartPulse, Flame, Siren, Zap, LifeBuoy, PhoneCall } from 'lucide-react';
import toast from 'react-hot-toast';
import { PostCard } from '@/components/posts/PostCard';
import { CreatePostModal } from '@/components/posts/CreatePostModal';
import { LocationBar } from '@/components/location/LocationBar';
import { LoadMore } from '@/components/shared/LoadMore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/Feedback';
import { useLocationStore, useUIStore } from '@/store/useStore';
import { usePaginated } from '@/hooks/usePaginated';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { api, buildQuery } from '@/lib/client';
import type { OfficialNumber } from '@/lib/emergency-numbers';
import { CONTACT_TYPES, type ContactType, type EmergencyContactDTO, type PostDTO } from '@/types';

const CONTACT_META: Record<ContactType, { label: string; icon: typeof Phone; className: string }> = {
  police: { label: 'Police', icon: Siren, className: 'bg-blue-100 text-blue-700' },
  fire: { label: 'Fire', icon: Flame, className: 'bg-orange-100 text-orange-700' },
  medical: { label: 'Medical', icon: HeartPulse, className: 'bg-rose-100 text-rose-700' },
  utility: { label: 'Utility', icon: Zap, className: 'bg-yellow-100 text-yellow-800' },
  helpline: { label: 'Helpline', icon: LifeBuoy, className: 'bg-violet-100 text-violet-700' },
  other: { label: 'Emergency', icon: PhoneCall, className: 'bg-red-100 text-red-700' },
};

interface ContactsResponse {
  official: OfficialNumber[];
  isFallback: boolean;
  community: EmergencyContactDTO[];
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^+0-9]/g, '')}`;
}

export default function EmergencyClient() {
  const requireAuth = useRequireAuth();
  const { location, radiusKm, hydrated } = useLocationStore();
  const openPicker = useUIStore((s) => s.openLocationPicker);
  const [contacts, setContacts] = useState<ContactsResponse | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    const query = buildQuery({
      countryCode: location?.place.countryCode,
      lat: location?.latitude,
      lng: location?.longitude,
    });
    api<ContactsResponse>(`/api/emergency/contacts${query}`)
      .then(setContacts)
      .catch(() => setContacts({ official: [{ label: 'Emergency', phone: '112', type: 'other', primary: true }], isFallback: true, community: [] }));
  }, [hydrated, location]);

  const alerts = usePaginated<PostDTO>(hydrated ? '/api/posts' : null, {
    type: 'emergency',
    active: 1,
    lat: location?.latitude,
    lng: location?.longitude,
    radiusKm: location ? Math.max(radiusKm ?? 25, 10) : null,
  });

  const primary = contacts?.official.filter((n) => n.primary) ?? [];
  const secondary = contacts?.official.filter((n) => !n.primary) ?? [];

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 lg:py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-7 h-7 text-emergency-500" /> Emergency
          </h1>
          <p className="text-sm text-gray-500">{location ? `Showing help for ${location.place.label}` : 'Set your location for local numbers and alerts'}</p>
        </div>
        <LocationBar showRadius={false} />
      </div>

      <section className="rounded-2xl bg-gradient-to-br from-emergency-500 to-emergency-700 p-5 text-white shadow-lg">
        <p className="text-sm font-medium opacity-90 mb-3">In immediate danger? Call now:</p>
        {!contacts ? (
          <div className="h-16 rounded-xl bg-white/20 animate-pulse" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {primary.map((n) => (
              <a key={n.phone + n.label} href={telHref(n.phone)} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-emergency-700 shadow hover:bg-red-50">
                <Phone className="w-6 h-6 flex-shrink-0" />
                <span>
                  <span className="block text-2xl font-extrabold leading-none">{n.phone}</span>
                  <span className="block text-xs font-medium text-gray-600 mt-1">{n.label}</span>
                </span>
              </a>
            ))}
          </div>
        )}
        {contacts?.isFallback && (
          <p className="mt-3 text-xs opacity-90">
            {location?.place.countryCode
              ? 'We don’t have verified numbers for your country yet. 112 works on most mobile phones worldwide; check your local authority’s number.'
              : 'Set your location to see your country’s official numbers. 112 works on most mobile phones worldwide.'}
          </p>
        )}
        {secondary.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {secondary.map((n) => (
              <a key={n.phone + n.label} href={telHref(n.phone)} className="flex items-center justify-between rounded-lg bg-white/15 px-3 py-2 text-sm hover:bg-white/25">
                <span className="truncate">{n.label}</span>
                <span className="font-bold ml-2">{n.phone}</span>
              </a>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <Info className="w-5 h-5 flex-shrink-0 text-amber-600" />
        <p>
          LocalVibe is <strong>not an emergency service</strong> and does not dispatch help. Always contact official services first. Alerts are posted by
          neighbors and may be inaccurate.
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-emergency-500" /> Active alerts nearby
          </h2>
          <Button variant="emergency" size="sm" onClick={() => requireAuth(() => setComposeOpen(true))}>
            <Plus className="w-4 h-4 mr-1" /> Post alert
          </Button>
        </div>
        {!location && hydrated && (
          <button onClick={openPicker} className="mb-3 w-full rounded-xl border border-dashed border-gray-300 bg-white p-3 text-sm text-gray-600 hover:border-community-400">
            Set your location to see alerts near you
          </button>
        )}
        <div className="space-y-4">
          {alerts.loading ? (
            <Spinner />
          ) : alerts.items.length === 0 ? (
            <EmptyState icon={ShieldAlert} title="No active alerts" description="Nothing reported in the last 48 hours. Stay safe!" />
          ) : (
            alerts.items.map((post) => <PostCard key={post.id} post={post} onUpdate={alerts.update} onDelete={alerts.remove} />)
          )}
          <LoadMore hasMore={alerts.hasMore} loading={alerts.loadingMore} onLoadMore={alerts.loadMore} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Local contacts</h2>
          <Button variant="outline" size="sm" onClick={() => requireAuth(() => (location ? setSuggestOpen(true) : openPicker()))}>
            <Plus className="w-4 h-4 mr-1" /> Suggest
          </Button>
        </div>
        {!contacts ? (
          <Spinner />
        ) : contacts.community.length === 0 ? (
          <p className="rounded-xl bg-white border border-gray-200 p-4 text-sm text-gray-500">
            No verified local contacts yet. Know your local police station, hospital or helpline? Suggest it and our moderators will verify it.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {contacts.community.map((c) => {
              const meta = CONTACT_META[c.type];
              const Icon = meta.icon;
              return (
                <li key={c.id} className="rounded-xl bg-white border border-gray-200 p-4 flex items-start gap-3">
                  <span className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.className}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 truncate">{meta.label} · {c.place.label}</p>
                    {c.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.description}</p>}
                    <a href={telHref(c.phone)} className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-community-600">
                      <Phone className="w-4 h-4" /> {c.phone}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {composeOpen && (
        <CreatePostModal open onClose={() => setComposeOpen(false)} onCreated={alerts.prepend} initialType="emergency" />
      )}
      {suggestOpen && <SuggestContactModal onClose={() => setSuggestOpen(false)} />}
    </div>
  );
}

function SuggestContactModal({ onClose }: { onClose: () => void }) {
  const location = useLocationStore((s) => s.location);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<ContactType>('police');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const result = await api<{ status: string }>('/api/emergency/contacts', {
        body: { name, phone, type, description: description || undefined, location },
      });
      toast.success(result.status === 'approved' ? 'Contact added' : 'Thanks! A moderator will verify it shortly.');
      onClose();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Suggest a local contact"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading} disabled={name.trim().length < 2 || phone.trim().length < 3}>Submit</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Add a public service near <strong>{location?.place.label}</strong>. Only official, publicly listed numbers please; no personal numbers.
        </p>
        <div>
          <label className="label">Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="e.g. City General Hospital" className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={25} inputMode="tel" placeholder="+1 555 0100" className="input-field" />
          </div>
          <div>
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as ContactType)} className="input-field">
              {CONTACT_TYPES.map((t) => (
                <option key={t} value={t}>{CONTACT_META[t].label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Details (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} maxLength={300} placeholder="Opening hours, address, what they help with" className="input-field resize-none" />
        </div>
      </div>
    </Modal>
  );
}
