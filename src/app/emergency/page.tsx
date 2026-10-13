import type { Metadata } from 'next';
import EmergencyClient from './EmergencyClient';

export const metadata: Metadata = {
  title: 'Emergency',
  description: 'Official emergency numbers, active local alerts and verified community contacts near you.',
};

export default function EmergencyPage() {
  return <EmergencyClient />;
}
