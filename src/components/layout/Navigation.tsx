'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  Home,
  Map,
  ShoppingBag,
  AlertTriangle,
  MessageCircle,
  Bell,
  User,
  Settings,
  LogOut,
  Shield,
  Plus,
} from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useCountsStore } from '@/hooks/useCounts';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2', className)}>
      <span className="w-8 h-8 bg-gradient-to-br from-community-500 to-marketplace-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
        LV
      </span>
      <span className="text-lg font-bold text-gray-900">LocalVibe</span>
    </Link>
  );
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span className={cn('min-w-[1.25rem] h-5 px-1 rounded-full bg-emergency-500 text-white text-[11px] font-bold flex items-center justify-center', className)}>
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`));
}

export function Navigation() {
  const { data: session, status } = useSession();
  const isActive = useIsActive();
  const { notifications, messages } = useCountsStore();
  const user = session?.user;

  const items = [
    { label: 'Feed', href: '/feed', icon: Home },
    { label: 'Map', href: '/map', icon: Map },
    { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { label: 'Emergency', href: '/emergency', icon: AlertTriangle },
    ...(user
      ? [
          { label: 'Messages', href: '/messages', icon: MessageCircle, count: messages },
          { label: 'Notifications', href: '/notifications', icon: Bell, count: notifications },
          { label: 'Profile', href: `/u/${user.username}`, icon: User },
          { label: 'Settings', href: '/settings', icon: Settings },
        ]
      : []),
    ...(user?.role === 'admin' ? [{ label: 'Admin', href: '/admin', icon: Shield }] : []),
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-30">
        <div className="px-6 py-5 border-b border-gray-100">
          <Logo />
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active ? 'bg-community-50 text-community-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('w-5 h-5', active && 'text-community-500')} />
                <span className="flex-1">{item.label}</span>
                {'count' in item && <CountBadge count={item.count ?? 0} />}
              </Link>
            );
          })}

          <Link
            href="/feed?compose=1"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-community-500 hover:bg-community-600 text-white font-semibold py-2.5 transition-colors"
          >
            <Plus className="w-5 h-5" /> Create post
          </Link>
        </div>

        <div className="p-3 border-t border-gray-100">
          {status === 'loading' ? (
            <div className="h-12 rounded-lg bg-gray-100 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <Link href={`/u/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar name={user.name} image={user.image} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link href="/auth/signin" className="text-center rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Sign in
              </Link>
              <Link href="/auth/signup" className="text-center rounded-lg bg-community-500 py-2 text-sm font-medium text-white hover:bg-community-600">
                Join
              </Link>
            </div>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 pt-3 text-xs text-gray-400">
            <Link href="/guidelines" className="hover:text-gray-600">Guidelines</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms</Link>
            <Link href="/privacy" className="hover:text-gray-600">Privacy</Link>
          </div>
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
        <div className="flex items-center justify-between px-4 h-14">
          <Logo />
          {user ? (
            <div className="flex items-center gap-1">
              <Link href="/messages" className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Messages">
                <MessageCircle className="w-5 h-5" />
                <CountBadge count={messages} className="absolute -top-0.5 -right-0.5" />
              </Link>
              <Link href="/notifications" className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100" aria-label="Notifications">
                <Bell className="w-5 h-5" />
                <CountBadge count={notifications} className="absolute -top-0.5 -right-0.5" />
              </Link>
              <Link href="/settings" className="ml-1" aria-label="Account">
                <Avatar name={user.name} image={user.image} size="sm" />
              </Link>
            </div>
          ) : status === 'unauthenticated' ? (
            <Link href="/auth/signin" className="rounded-lg bg-community-500 px-3 py-1.5 text-sm font-medium text-white">
              Sign in
            </Link>
          ) : null}
        </div>
      </header>
    </>
  );
}
