import type { Workout, Discipline, DistanceUnit } from '@/types';
import { DISCIPLINE_COLORS } from '@/constants/disciplines';
import { formatDuration } from '@/utils/date';
import { formatDistance } from '@/utils/distance';

interface DisciplineVolume {
  planned: number;
  completed: number;
  plannedDist: number;
  completedDist: number;
  distUnit: DistanceUnit | null;
}

interface WeekVolumeSummaryProps {
  workouts: Workout[];
  compact?: boolean;
}

export default function WeekVolumeSummary({ workouts, compact = false }: WeekVolumeSummaryProps) {
  const volumeByDiscipline: Partial<Record<Discipline, DisciplineVolume>> = {};
  let totalPlanned = 0;
  let totalCompleted = 0;

  for (const w of workouts) {
    if (w.discipline === 'rest') continue;

    if (!volumeByDiscipline[w.discipline]) {
      volumeByDiscipline[w.discipline] = {
        planned: 0,
        completed: 0,
        plannedDist: 0,
        completedDist: 0,
        distUnit: w.distance_unit || null,
      };
    }

    const vol = volumeByDiscipline[w.discipline]!;
    vol.planned += w.duration_minutes;
    totalPlanned += w.duration_minutes;

    if (w.status === 'completed') {
      vol.completed += w.actual_duration || w.duration_minutes;
      totalCompleted += w.actual_duration || w.duration_minutes;
    }

    if (w.distance) {
      vol.plannedDist += w.distance;
      if (w.status === 'completed') {
        vol.completedDist += w.actual_distance || w.distance;
      }
    }
  }

  if (totalPlanned === 0) return null;

  const entries = Object.entries(volumeByDiscipline) as [Discipline, DisciplineVolume][];
  const completedCount = workouts.filter((w) => w.status === 'completed').length;
  const totalCount = workouts.filter((w) => w.discipline !== 'rest').length;

  return (
    <div className={`mx-4 glass rounded-xl p-3 ${compact ? 'mb-2' : 'mb-3'}`}>
      {/* Completion header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-text">
          Week: {formatDuration(totalCompleted)}/{formatDuration(totalPlanned)}
        </span>
        <span className="text-xs text-muted">
          {completedCount}/{totalCount} done
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="h-1.5 rounded-full bg-white/5 mb-3">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${Math.min(100, (totalCompleted / totalPlanned) * 100)}%` }}
        />
      </div>

      {/* Discipline breakdown */}
      <div className={`flex flex-col gap-1.5 ${compact ? '' : ''}`}>
        {entries.map(([disc, vol]) => {
          const pct = vol.planned > 0 ? Math.min(100, (vol.completed / vol.planned) * 100) : 0;
          return (
            <div key={disc} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: DISCIPLINE_COLORS[disc] }}
              />
              <span className="text-xs text-muted capitalize w-16 flex-shrink-0">{disc}</span>
              <div className="flex-1 h-1 rounded-full bg-white/5">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: DISCIPLINE_COLORS[disc],
                  }}
                />
              </div>
              <span className="text-xs text-muted w-20 text-right flex-shrink-0">
                {formatDuration(vol.completed)}/{formatDuration(vol.planned)}
              </span>
              {!compact && vol.plannedDist > 0 && vol.distUnit && (
                <span className="text-xs text-muted/60 w-20 text-right flex-shrink-0">
                  {formatDistance(vol.completedDist, vol.distUnit)}/{formatDistance(vol.plannedDist, vol.distUnit)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
