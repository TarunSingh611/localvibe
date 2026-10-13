import type { ListingCategory, ListingCondition } from '@/types';

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  electronics: 'Electronics',
  furniture: 'Furniture',
  'home-garden': 'Home & Garden',
  clothing: 'Clothing',
  books: 'Books',
  sports: 'Sports & Outdoors',
  vehicles: 'Vehicles & Bikes',
  'toys-games': 'Toys & Games',
  services: 'Services',
  'free-stuff': 'Free stuff',
  other: 'Other',
};

export const CONDITION_LABELS: Record<ListingCondition, string> = {
  new: 'New',
  'like-new': 'Like new',
  good: 'Good',
  fair: 'Fair',
};
