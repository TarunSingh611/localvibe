import { route, ok, badRequest, clientIp } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { reverseGeocode, searchPlaces } from '@/lib/geo';

export const GET = route(async (request) => {
  await rateLimit({ key: `geocode:${clientIp(request)}`, limit: 60, windowSeconds: 60 });
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (query) {
    if (query.length < 2 || query.length > 120) throw badRequest('Search must be 2-120 characters');
    return ok({ results: await searchPlaces(query) });
  }

  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw badRequest('Provide ?q= or valid ?lat=&lon=');
  }
  return ok({ place: await reverseGeocode(lat, lon) });
});
