import type { Metadata } from 'next';
import MarketplaceClient from './MarketplaceClient';

export const metadata: Metadata = {
  title: 'Local marketplace',
  description: 'Buy, sell and give away items with people in your neighborhood. No fees.',
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
