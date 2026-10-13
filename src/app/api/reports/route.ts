import { ObjectId } from 'mongodb';
import { route, ok, parseBody, notFound, badRequest } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { reportSchema } from '@/lib/validation';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import type { ReportDoc } from '@/types';

const AUTO_HIDE_THRESHOLD = 5;

const COLLECTIONS = {
  post: 'posts',
  comment: 'comments',
  listing: 'listings',
  user: 'users',
} as const;

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `report:${user._id}`, limit: 20, windowSeconds: 3600 });
  const input = await parseBody(request, reportSchema);

  const targetId = toObjectId(input.targetId);
  if (!targetId) throw notFound();
  if (input.targetType === 'user' && targetId.equals(user._id)) throw badRequest('You cannot report yourself');

  const db = await getDatabase();
  const target = await db.collection(COLLECTIONS[input.targetType]).findOne({ _id: targetId }, { projection: { _id: 1 } });
  if (!target) throw notFound('That content no longer exists');

  const reports = db.collection<ReportDoc>('reports');
  const already = await reports.findOne({ targetId, reporterId: user._id, status: 'open' });
  if (already) return ok({ success: true, alreadyReported: true });

  await reports.insertOne({
    _id: new ObjectId(),
    targetType: input.targetType,
    targetId,
    reporterId: user._id,
    reason: input.reason,
    details: input.details,
    status: 'open',
    createdAt: new Date(),
  });

  if (input.targetType !== 'user') {
    const collection = db.collection(COLLECTIONS[input.targetType]);
    const updated = await collection.findOneAndUpdate(
      { _id: targetId },
      { $inc: { reportCount: 1 } },
      { returnDocument: 'after', projection: { reportCount: 1 } }
    );
    if ((updated?.reportCount ?? 0) >= AUTO_HIDE_THRESHOLD) {
      await collection.updateOne({ _id: targetId }, { $set: { status: 'hidden' } });
    }
  }

  return ok({ success: true }, { status: 201 });
});
