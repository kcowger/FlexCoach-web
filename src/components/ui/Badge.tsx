import type { Discipline } from '@/types';
import {
  DISCIPLINE_COLORS,
  DISCIPLINE_LABELS,
  DISCIPLINE_ICONS,
} from '@/constants/disciplines';

interface BadgeProps {
  discipline: Discipline;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

const sizeClasses: Record<NonNullable<BadgeProps['size']>, { badge: string; icon: string }> = {
  sm: { badge: 'px-2 py-0.5 text-xs gap-1', icon: 'h-3 w-3' },
  md: { badge: 'px-3 py-1 text-sm gap-1.5', icon: 'h-4 w-4' },
};

export default function Badge({
  discipline,
  showLabel = true,
  size = 'md',
}: BadgeProps) {
  const color = DISCIPLINE_COLORS[discipline];
  const label = DISCIPLINE_LABELS[discipline];
  const Icon = DISCIPLINE_ICONS[discipline];
  const s = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${s.badge}`}
      style={{ backgroundColor: `${color}33`, color }}
    >
      <Icon className={s.icon} />
      {showLabel && label}
    </span>
  );
}
