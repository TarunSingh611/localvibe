import { ObjectId, type Filter } from 'mongodb';
import { route, ok, parseBody } from '@/lib/api';
import { requireUser } from '@/lib/session';
import { rateLimit } from '@/lib/rate-limit';
import { emergencyContactSchema } from '@/lib/validation';
import { getDatabase } from '@/lib/mongodb';
import { geoPoint, withinRadius } from '@/lib/geo';
import { getOfficialNumbers } from '@/lib/emergency-numbers';
import type { EmergencyContactDoc, EmergencyContactDTO } from '@/types';

export const dynamic = 'force-dynamic';

export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const countryCode = searchParams.get('countryCode')?.toUpperCase() || undefined;
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));
  const hasOrigin = Number.isFinite(lat) && Number.isFinite(lng) && searchParams.has('lat');

  const official = getOfficialNumbers(countryCode);

  const filter: Filter<EmergencyContactDoc> = { status: 'approved' };
  if (hasOrigin) filter.location = withinRadius(lat, lng, 50);
  else if (countryCode) filter['place.countryCode'] = countryCode;

  const community = countryCode || hasOrigin
    ? await (await getDatabase()).collection<EmergencyContactDoc>('emergencyContacts').find(filter).limit(50).toArray()
    : [];

  return ok({
    official: official.numbers,
    isFallback: official.isFallback,
    community: community.map<EmergencyContactDTO>((c) => ({
      id: c._id.toString(),
      name: c.name,
      phone: c.phone,
      type: c.type,
      description: c.description,
      place: c.place,
      source: 'community',
    })),
  });
});

export const POST = route(async (request) => {
  const user = await requireUser();
  await rateLimit({ key: `contact:${user._id}`, limit: 5, windowSeconds: 86400 });
  const input = await parseBody(request, emergencyContactSchema);

  await (await getDatabase()).collection<EmergencyContactDoc>('emergencyContacts').insertOne({
    _id: new ObjectId(),
    name: input.name,
    phone: input.phone,
    type: input.type,
    description: input.description,
    place: input.location.place,
    location: geoPoint(input.location.latitude, input.location.longitude),
    submittedBy: user._id,
    status: user.role === 'admin' ? 'approved' : 'pending',
    createdAt: new Date(),
  });

  return ok({ success: true, status: user.role === 'admin' ? 'approved' : 'pending' }, { status: 201 });
});
