import { route, ok, parseBody, notFound } from '@/lib/api';
import { requireAdmin } from '@/lib/session';
import { adminContactActionSchema } from '@/lib/validation';
import { getDatabase, toObjectId } from '@/lib/mongodb';
import type { EmergencyContactDoc } from '@/types';

export const POST = route(async (request) => {
  await requireAdmin();
  const { contactId, action } = await parseBody(request, adminContactActionSchema);
  const id = toObjectId(contactId);
  if (!id) throw notFound();

  const result = await (await getDatabase())
    .collection<EmergencyContactDoc>('emergencyContacts')
    .updateOne({ _id: id }, { $set: { status: action === 'approve' ? 'approved' : 'rejected' } });
  if (!result.matchedCount) throw notFound();
  return ok({ success: true });
});
