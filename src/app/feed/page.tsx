import { Suspense } from 'react';
import type { Metadata } from 'next';
import FeedClient from './FeedClient';
import { Spinner } from '@/components/ui/Feedback';

export const metadata: Metadata = {
  title: 'Local feed',
  description: 'What is happening in your neighborhood right now: news, events, questions and lost & found.',
};

export default function FeedPage() {
  return (
    <Suspense fallback={<Spinner label="Loading…" />}>
      <FeedClient />
    </Suspense>
  );
}
