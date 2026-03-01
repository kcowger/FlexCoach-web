import type { Equipment, Injury } from '@/types';

export const DEFAULT_EQUIPMENT: Equipment = {
  mat: true,
  pushup_bars: true,
  kettlebell_35lb: true,
  ab_roller: true,
  pool_access: true,
  indoor_bike: true,
  outdoor_bike: true,
  open_space: true,
};

export const DEFAULT_INJURIES: Injury[] = [
  {
    area: 'left_knee',
    type: 'Torn ACL',
    notes: 'Fully recovered. Be mindful of knee-loading exercises. Include prehab/warm-up.',
    recovered: true,
  },
];

export const DEFAULT_GOALS =
  'Feel like an athlete again. Build muscle and strength. Look good. Be healthy.';

export const EVENT_TYPE_LABELS: Record<string, string> = {
  sprint_tri: 'Sprint Triathlon',
  olympic_tri: 'Olympic Triathlon',
  half_iron: 'Half Ironman (70.3)',
  full_iron: 'Full Ironman (140.6)',
  marathon: 'Marathon',
  half_marathon: 'Half Marathon',
  '10k': '10K',
  '5k': '5K',
  century_ride: 'Century Ride',
  open_water_swim: 'Open Water Swim',
  other: 'Other',
};

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_LABELS_FULL = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Morning (5-7am)',
  midday: 'Midday (11am-1pm)',
  evening: 'Evening (6-9pm)',
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  mat: 'Exercise Mat',
  pushup_bars: 'Push-up Bars/Handles',
  kettlebell_35lb: '35lb Kettlebell',
  ab_roller: 'Ab Roller',
  pool_access: 'Pool Access',
  indoor_bike: 'Indoor Bike',
  outdoor_bike: 'Outdoor Bike',
  open_space: 'Open Space (basement)',
};
