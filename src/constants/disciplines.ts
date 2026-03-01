import { Waves, Bike, Footprints, Dumbbell, Moon, Leaf, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Discipline } from '@/types';

export const DISCIPLINE_COLORS: Record<Discipline, string> = {
  swim: '#0EA5E9',
  bike: '#22C55E',
  run: '#F97316',
  strength: '#A855F7',
  rest: '#94A3B8',
  recovery: '#14B8A6',
  brick: '#EAB308',
};

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  swim: 'Swim',
  bike: 'Bike',
  run: 'Run',
  strength: 'Strength',
  rest: 'Rest',
  recovery: 'Recovery',
  brick: 'Brick',
};

export const DISCIPLINE_ICONS: Record<Discipline, LucideIcon> = {
  swim: Waves,
  bike: Bike,
  run: Footprints,
  strength: Dumbbell,
  rest: Moon,
  recovery: Leaf,
  brick: Layers,
};
