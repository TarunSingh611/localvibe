import { Users, CalendarDays, HelpCircle, Search, AlertTriangle } from 'lucide-react';
import type { EmergencyCategory, PostType, Severity } from '@/types';

export const POST_TYPE_META: Record<PostType, { label: string; icon: typeof Users; badge: string; description: string }> = {
  community: { label: 'Community', icon: Users, badge: 'bg-community-100 text-community-700', description: 'News, tips & updates' },
  event: { label: 'Event', icon: CalendarDays, badge: 'bg-violet-100 text-violet-700', description: 'Something happening soon' },
  question: { label: 'Question', icon: HelpCircle, badge: 'bg-amber-100 text-amber-700', description: 'Ask your neighbors' },
  lostfound: { label: 'Lost & Found', icon: Search, badge: 'bg-teal-100 text-teal-700', description: 'Pets, keys, wallets…' },
  emergency: { label: 'Emergency', icon: AlertTriangle, badge: 'bg-emergency-100 text-emergency-700', description: 'Urgent safety alert' },
};

export const SEVERITY_META: Record<Severity, { label: string; className: string }> = {
  low: { label: 'Low', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-300' },
};

export const EMERGENCY_CATEGORY_LABELS: Record<EmergencyCategory, string> = {
  fire: 'Fire',
  medical: 'Medical',
  crime: 'Crime / safety',
  weather: 'Weather',
  power: 'Power outage',
  water: 'Water',
  traffic: 'Traffic / road',
  other: 'Other',
};
