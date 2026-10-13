'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Newspaper, ShoppingBag, UserPlus, Flag, Phone, Check, X, EyeOff, Ban, RefreshCw, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState, PageHeader, Spinner } from '@/components/ui/Feedback';
import { api } from '@/lib/client';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { ContactType, Place, PublicUser, ReportReason } from '@/types';

interface AdminReport {
  id: string;
  targetType: 'post' | 'comment' | 'listing' | 'user';
  targetId: string;
  reason: ReportReason;
  details?: string;
  createdAt: string;
  reporter?: PublicUser;
  target: { preview: string; status?: string; owner?: PublicUser } | null;
}

interface AdminContact {
  id: string;
  name: string;
  phone: string;
  type: ContactType;
  description?: string;
  place: Place;
  submittedBy?: PublicUser;
  createdAt: string;
}

interface AdminData {
  stats: { users: number; posts: number; listings: number; newUsers: number; openReports: number };
  reports: AdminReport[];
  contacts: AdminContact[];
}

function targetHref(report: AdminReport) {
  switch (report.targetType) {
    case 'post':
      return `/posts/${report.targetId}`;
    case 'listing':
      return `/marketplace/${report.targetId}`;
    case 'user':
      return report.target?.owner ? `/u/${report.target.owner.username}` : null;
    default:
      return null;
  }
}

export default function AdminClient() {
  const [data, setData] = useState<AdminData | null>(null);
  const [tab, setTab] = useState<'reports' | 'contacts'>('reports');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(
    () =>
      api<AdminData>('/api/admin')
        .then(setData)
        .catch((e) => toast.error((e as Error).message)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const actOnReport = async (report: AdminReport, action: 'dismiss' | 'hide' | 'hide_and_ban') => {
    if (action === 'hide_and_ban' && !confirm(`Remove this ${report.targetType} and suspend ${report.target?.owner?.name ?? 'the owner'}?`)) return;
    setBusy(report.id);
    try {
      await api('/api/admin/reports', { body: { reportId: report.id, action } });
      setData((d) =>
        d && {
          ...d,
          stats: { ...d.stats, openReports: Math.max(0, d.stats.openReports - d.reports.filter((r) => r.targetId === report.targetId).length) },
          reports: d.reports.filter((r) => r.targetId !== report.targetId),
        }
      );
      toast.success(action === 'dismiss' ? 'Report dismissed' : action === 'hide' ? 'Content removed' : 'Removed and user suspended');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const actOnContact = async (contact: AdminContact, action: 'approve' | 'reject') => {
    setBusy(contact.id);
    try {
      await api('/api/admin/contacts', { body: { contactId: contact.id, action } });
      setData((d) => d && { ...d, contacts: d.contacts.filter((c) => c.id !== contact.id) });
      toast.success(action === 'approve' ? 'Contact approved' : 'Contact rejected');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!data) return <Spinner className="py-24" label="Loading dashboard…" />;

  const stats = [
    { label: 'Users', value: data.stats.users, icon: Users },
    { label: 'New today', value: data.stats.newUsers, icon: UserPlus },
    { label: 'Posts', value: data.stats.posts, icon: Newspaper },
    { label: 'Listings', value: data.stats.listings, icon: ShoppingBag },
    { label: 'Open reports', value: data.stats.openReports, icon: Flag },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 lg:py-8">
      <PageHeader
        title="Moderation"
        subtitle="Keep LocalVibe safe and useful"
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <Icon className="w-5 h-5 text-gray-400 mb-2" />
            <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('reports')} className={cn('chip', tab === 'reports' ? 'chip-active' : 'chip-idle')}>
          <Flag className="w-4 h-4" /> Reports ({data.reports.length})
        </button>
        <button onClick={() => setTab('contacts')} className={cn('chip', tab === 'contacts' ? 'chip-active' : 'chip-idle')}>
          <Phone className="w-4 h-4" /> Contact submissions ({data.contacts.length})
        </button>
      </div>

      {tab === 'reports' ? (
        data.reports.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No open reports" description="Nice, the community is behaving." />
        ) : (
          <ul className="space-y-3">
            {data.reports.map((report) => {
              const href = targetHref(report);
              return (
                <li key={report.id} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                    <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 font-semibold uppercase">{report.reason}</span>
                    <span className="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 font-medium">{report.targetType}</span>
                    {report.target?.status && report.target.status !== 'active' && (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 font-medium">{report.target.status}</span>
                    )}
                    <span className="text-gray-400">{formatRelativeTime(report.createdAt)} · by @{report.reporter?.username ?? 'unknown'}</span>
                  </div>
                  {report.target ? (
                    <blockquote className="border-l-4 border-gray-200 pl-3 text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {report.target.preview || <em className="text-gray-400">(no text)</em>}
                    </blockquote>
                  ) : (
                    <p className="text-sm text-gray-400 italic">Content already deleted</p>
                  )}
                  {report.details && <p className="mt-2 text-sm text-gray-600"><strong>Reporter says:</strong> {report.details}</p>}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {report.target?.owner && (
                        <Link href={`/u/${report.target.owner.username}`} className="flex items-center gap-2 hover:underline">
                          <Avatar name={report.target.owner.name} image={report.target.owner.image} size="xs" />
                          {report.target.owner.name}
                        </Link>
                      )}
                      {href && (
                        <Link href={href} target="_blank" className="text-community-600 hover:underline">
                          Open
                        </Link>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => actOnReport(report, 'dismiss')} disabled={busy === report.id}>
                        <Check className="w-4 h-4 mr-1" /> Dismiss
                      </Button>
                      {report.targetType !== 'user' && (
                        <Button size="sm" variant="secondary" onClick={() => actOnReport(report, 'hide')} disabled={busy === report.id}>
                          <EyeOff className="w-4 h-4 mr-1" /> Remove
                        </Button>
                      )}
                      <Button size="sm" variant="emergency" onClick={() => actOnReport(report, 'hide_and_ban')} disabled={busy === report.id}>
                        <Ban className="w-4 h-4 mr-1" /> {report.targetType === 'user' ? 'Suspend' : 'Remove & suspend'}
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      ) : data.contacts.length === 0 ? (
        <EmptyState icon={Phone} title="No pending submissions" />
      ) : (
        <ul className="space-y-3">
          {data.contacts.map((contact) => (
            <li key={contact.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-600">
                    <span className="font-mono">{contact.phone}</span> · {contact.type} · {contact.place.label}
                  </p>
                  {contact.description && <p className="text-sm text-gray-500 mt-1">{contact.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted {formatRelativeTime(contact.createdAt)} by @{contact.submittedBy?.username ?? 'unknown'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => actOnContact(contact, 'reject')} disabled={busy === contact.id}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="marketplace" onClick={() => actOnContact(contact, 'approve')} disabled={busy === contact.id}>
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-2">Verify the number against an official source before approving.</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
