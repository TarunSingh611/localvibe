import { route, ok, parseBody, notFound } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { adminReportActionSchema } from '@/lib/validation';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import { notify } from '@/lib/notifications';
import type { ObjectId } from 'mongodb';
import type { ReportDoc } from '@/types';

const COLLECTIONS = { post: 'posts', comment: 'comments', listing: 'listings', user: 'users' } as const;

export const POST = route(async (request) => {
  const admin = await requireAdmin();
  const { reportId, action } = await parseBody(request, adminReportActionSchema);
  const id = toObjectId(reportId);
  if (!id) throw notFound();

  const db = await getDatabase();
  const reports = db.collection<ReportDoc>('reports');
  const report = await reports.findOne({ _id: id });
  if (!report) throw notFound();

  const collection = db.collection(COLLECTIONS[report.targetType]);
  const target = await collection.findOne({ _id: report.targetId });
  let ownerId: ObjectId | undefined;

  if (target && action !== 'dismiss') {
    if (report.targetType === 'user') {
      ownerId = target._id;
    } else {
      ownerId = target.authorId ?? target.sellerId;
      await collection.updateOne({ _id: report.targetId }, { $set: { status: 'hidden' } });
      if (report.targetType === 'comment' && target.status === 'active') {
        await db.collection('posts').updateOne({ _id: target.postId }, { $inc: { commentCount: -1 } });
      }
    }
    if (action === 'hide_and_ban' && ownerId && !ownerId.equals(admin._id)) {
      await db.collection('users').updateOne({ _id: ownerId }, { $set: { banned: true } });
    } else if (ownerId && report.targetType !== 'user') {
      await notify({
        userId: ownerId,
        type: 'moderation',
        text: `Your ${report.targetType} was removed for violating the Community Guidelines (${report.reason}).`,
        link: '/guidelines',
      });
    }
  }

  // Resolve every open report about the same target at once.
  await reports.updateMany(
    { targetId: report.targetId, status: 'open' },
    {
      $set: {
        status: action === 'dismiss' ? 'dismissed' : 'resolved',
        action,
        resolvedBy: admin._id,
        resolvedAt: new Date(),
      },
    }
  );

  if (action === 'dismiss' && target && report.targetType !== 'user' && target.status === 'hidden') {
    await collection.updateOne({ _id: report.targetId }, { $set: { status: 'active', reportCount: 0 } });
  }

  return ok({ success: true });
});
