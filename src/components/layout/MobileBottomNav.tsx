'use client';

import Link from 'next/link';
import { Home, Map, ShoppingBag, AlertTriangle, Plus } from 'lucide-react';
import { useIsActive } from './Navigation';
import { cn } from '@/lib/utils';

const items = [
  { label: 'Feed', href: '/feed', icon: Home },
  { label: 'Map', href: '/map', icon: Map },
  { label: 'Post', href: '/feed?compose=1', icon: Plus, primary: true },
  { label: 'Market', href: '/marketplace', icon: ShoppingBag },
  { label: 'Alerts', href: '/emergency', icon: AlertTriangle },
];

export function MobileBottomNav() {
  const isActive = useIsActive();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around h-16">
        {items.map((item) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <Link key={item.label} href={item.href} className="flex items-center justify-center flex-1" aria-label="Create post">
                <span className="w-11 h-11 rounded-full bg-community-500 text-white flex items-center justify-center shadow-md">
                  <Icon className="w-6 h-6" />
                </span>
              </Link>
            );
          }
          const active = isActive(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-0.5 text-[11px] font-medium',
                active ? 'text-community-600' : 'text-gray-500'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
