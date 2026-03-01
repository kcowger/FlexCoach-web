import type { Discipline, DistanceUnit } from '@/types';

/** Returns a sensible default distance unit for a given discipline */
export function defaultDistanceUnit(discipline: Discipline): DistanceUnit | null {
  switch (discipline) {
    case 'swim': return 'yd';
    case 'bike': return 'mi';
    case 'run': return 'mi';
    default: return null;
  }
}

/** Format distance with unit, e.g. "3.1 mi" or "1500 yd" */
export function formatDistance(distance: number, unit: DistanceUnit): string {
  const formatted = (unit === 'mi' || unit === 'km')
    ? distance.toFixed(1).replace(/\.0$/, '')
    : String(Math.round(distance));
  return `${formatted} ${unit}`;
}

/** Returns true if the discipline typically tracks distance */
export function hasDistance(discipline: Discipline): boolean {
  return discipline === 'swim' || discipline === 'bike' || discipline === 'run';
}
