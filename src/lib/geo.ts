import type { Place, UserLocation } from '@/types';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

function headers() {
  const contact = process.env.CONTACT_EMAIL || process.env.NEXT_PUBLIC_APP_URL || 'localvibe';
  return {
    'User-Agent': `LocalVibe/1.0 (${contact})`,
    'Accept-Language': 'en',
    Accept: 'application/json',
  };
}

interface NominatimAddress {
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city_district?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

function toPlace(address: NominatimAddress = {}, fallback = 'Unknown area'): Place {
  const city = address.city || address.town || address.village || address.municipality || address.county;
  const area = address.neighbourhood || address.suburb || address.quarter || address.city_district;
  const labelParts = [area, city || address.state].filter(Boolean);
  return {
    label: labelParts.length ? [...new Set(labelParts)].join(', ') : address.country || fallback,
    city,
    state: address.state,
    country: address.country,
    countryCode: address.country_code?.toUpperCase(),
  };
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<Place> {
  const params = new URLSearchParams({
    lat: latitude.toFixed(5),
    lon: longitude.toFixed(5),
    format: 'jsonv2',
    addressdetails: '1',
    zoom: '16',
  });
  const response = await fetch(`${NOMINATIM}/reverse?${params}`, {
    headers: headers(),
    next: { revalidate: 60 * 60 * 24 * 7 },
  });
  if (!response.ok) throw new Error(`Reverse geocoding failed (${response.status})`);
  const data = (await response.json()) as { address?: NominatimAddress };
  return toPlace(data.address, `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
}

export async function searchPlaces(query: string): Promise<UserLocation[]> {
  const params = new URLSearchParams({ q: query, format: 'jsonv2', addressdetails: '1', limit: '6' });
  const response = await fetch(`${NOMINATIM}/search?${params}`, {
    headers: headers(),
    next: { revalidate: 60 * 60 * 24 * 7 },
  });
  if (!response.ok) throw new Error(`Place search failed (${response.status})`);
  const data = (await response.json()) as Array<{ lat: string; lon: string; display_name: string; address?: NominatimAddress }>;
  return data.map((item) => {
    const place = toPlace(item.address, item.display_name);
    return {
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      place: { ...place, label: place.label === 'Unknown area' ? item.display_name.split(',').slice(0, 2).join(',') : place.label },
    };
  });
}

export function geoPoint(latitude: number, longitude: number) {
  return { type: 'Point' as const, coordinates: [longitude, latitude] as [number, number] };
}

/** MongoDB $geoWithin filter for a circle of radiusKm around a point. */
export function withinRadius(latitude: number, longitude: number, radiusKm: number) {
  return {
    $geoWithin: { $centerSphere: [[longitude, latitude], radiusKm / 6378.1] },
  };
}
