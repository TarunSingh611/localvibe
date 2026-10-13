'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;
  title: string;
  subtitle?: string;
  href?: string;
  pulse?: boolean;
}

export interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  radiusKm?: number | null;
  showCenter?: boolean;
  interactive?: boolean;
  onMoveEnd?: (center: { lat: number; lng: number }, zoom: number) => void;
  className?: string;
}

const iconCache = new Map<string, L.DivIcon>();

function markerIcon(color: string, pulse = false) {
  const key = `${color}-${pulse}`;
  if (!iconCache.has(key)) {
    iconCache.set(
      key,
      L.divIcon({
        className: '',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12],
        html: `<span style="position:relative;display:block;width:22px;height:22px">
          ${pulse ? `<span style="position:absolute;inset:-6px;border-radius:9999px;background:${color};opacity:.35;animation:lvPulse 1.6s ease-out infinite"></span>` : ''}
          <span style="position:absolute;inset:0;border-radius:9999px;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>
        </span>`,
      })
    );
  }
  return iconCache.get(key)!;
}

const centerIcon = L.divIcon({
  className: '',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  html: '<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,.25)"></span>',
});

function Recenter({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom ?? map.getZoom(), { animate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

function MoveListener({ onMoveEnd }: { onMoveEnd: NonNullable<LeafletMapProps['onMoveEnd']> }) {
  const map = useMapEvents({
    moveend: () => onMoveEnd(map.getCenter(), map.getZoom()),
  });
  return null;
}

export default function LeafletMap({
  center,
  zoom = 13,
  markers = [],
  radiusKm,
  showCenter = true,
  interactive = true,
  onMoveEnd,
  className = 'h-96 w-full',
}: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={className}
      scrollWheelZoom={interactive}
      dragging={interactive}
      zoomControl={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      attributionControl
    >
      <style>{'@keyframes lvPulse{0%{transform:scale(.6);opacity:.6}100%{transform:scale(1.6);opacity:0}}'}</style>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'}
        maxZoom={19}
      />
      <Recenter center={center} zoom={zoom} />
      {onMoveEnd && <MoveListener onMoveEnd={onMoveEnd} />}
      {radiusKm ? (
        <Circle center={center} radius={radiusKm * 1000} pathOptions={{ color: '#0ea5e9', weight: 1.5, fillOpacity: 0.06 }} />
      ) : null}
      {showCenter && <Marker position={center} icon={centerIcon} interactive={false} />}
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={markerIcon(marker.color, marker.pulse)}>
          <Popup>
            <div className="min-w-[10rem] max-w-[14rem]">
              <p className="font-semibold text-gray-900 text-sm leading-snug">{marker.title}</p>
              {marker.subtitle && <p className="text-xs text-gray-500 mt-0.5">{marker.subtitle}</p>}
              {marker.href && (
                <Link href={marker.href} className="inline-block mt-1.5 text-xs font-semibold text-community-600">
                  View details →
                </Link>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
