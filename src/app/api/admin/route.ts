import type { ObjectId } from 'mongodb';
import { route, ok } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { getDatabase } from '@/lib/mongodb';
import { loadUsersById } from '@/lib/users';
import type { EmergencyContactDoc, ReportDoc } from '@/types';

export const dynamic = 'force-dynamic';

const COLLECTIONS = { post: 'posts', comment: 'comments', listing: 'listings', user: 'users' } as const;

export const GET = route(async () => {
  await requireAdmin();
  const db = await getDatabase();
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);

  const [users, posts, listings, newUsers, openReports, reports, contacts] = await Promise.all([
    db.collection('users').estimatedDocumentCount(),
    db.collection('posts').estimatedDocumentCount(),
    db.collection('listings').estimatedDocumentCount(),
    db.collection('users').countDocuments({ createdAt: { $gt: dayAgo } }),
    db.collection('reports').countDocuments({ status: 'open' }),
    db.collection<ReportDoc>('reports').find({ status: 'open' }).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection<EmergencyContactDoc>('emergencyContacts').find({ status: 'pending' }).sort({ createdAt: 1 }).limit(50).toArray(),
  ]);

  const targets = new Map<string, { preview: string; ownerId?: ObjectId; status?: string }>();
  for (const type of Object.keys(COLLECTIONS) as Array<keyof typeof COLLECTIONS>) {
    const ids = reports.filter((r) => r.targetType === type).map((r) => r.targetId);
    if (!ids.length) continue;
    const docs = await db.collection(COLLECTIONS[type]).find({ _id: { $in: ids } }).toArray();
    for (const doc of docs) {
      const preview =
        type === 'listing' ? `${doc.title}: ${doc.description}` : type === 'user' ? `@${doc.username} (${doc.name})` : doc.text;
      targets.set(doc._id.toString(), {
        preview: String(preview ?? '').slice(0, 280),
        ownerId: type === 'user' ? doc._id : doc.authorId ?? doc.sellerId,
        status: type === 'user' ? (doc.banned ? 'banned' : 'active') : doc.status,
      });
    }
  }

  const people = await loadUsersById([
    ...reports.map((r) => r.reporterId),
    ...[...targets.values()].map((t) => t.ownerId).filter((id): id is ObjectId => Boolean(id)),
    ...contacts.map((c) => c.submittedBy),
  ]);

  return ok({
    stats: { users, posts, listings, newUsers, openReports },
    reports: reports.map((r) => {
      const target = targets.get(r.targetId.toString());
      return {
        id: r._id.toString(),
        targetType: r.targetType,
        targetId: r.targetId.toString(),
        reason: r.reason,
        details: r.details,
        createdAt: r.createdAt.toISOString(),
        reporter: people.get(r.reporterId.toString()),
        target: target
          ? { preview: target.preview, status: target.status, owner: target.ownerId ? people.get(target.ownerId.toString()) : undefined }
          : null,
      };
    }),
    contacts: contacts.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      type: c.type,
      description: c.description,
      place: c.place,
      submittedBy: people.get(c.submittedBy.toString()),
      createdAt: c.createdAt.toISOString(),
    })),
  });
});
