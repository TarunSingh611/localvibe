import { cn } from '@/lib/utils';
import { imageUrl } from '@/lib/client';

const COLORS = ['bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500'];

interface AvatarProps {
  name?: string | null;
  image?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-3xl',
};

export function Avatar({ name, image, size = 'md', className }: AvatarProps) {
  const label = (name || '?').trim();
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const color = COLORS[[...label].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl(image, 160)}
        alt={label}
        className={cn('rounded-full object-cover flex-shrink-0 bg-gray-100', SIZES[size], className)}
      />
    );
  }
  return (
    <div
      aria-label={label}
      className={cn('rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0', color, SIZES[size], className)}
    >
      {initials || '?'}
    </div>
  );
}
