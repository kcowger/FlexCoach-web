import { CheckCircle2, XCircle, Pencil } from 'lucide-react';
import type { Workout } from '@/types';
import Badge from '@/components/ui/Badge';
import { formatDuration } from '@/utils/date';
import { formatDistance } from '@/utils/distance';

interface WorkoutCardProps {
  workout: Workout;
  onClick?: () => void;
  onComplete?: () => void;
  onCustomize?: () => void;
  onSkip?: () => void;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
};

const DISCIPLINE_COLORS: Record<string, string> = {
  swim: 'border-l-swim',
  bike: 'border-l-bike',
  run: 'border-l-run',
  strength: 'border-l-strength',
  rest: 'border-l-rest',
  recovery: 'border-l-recovery',
  brick: 'border-l-brick',
};

export default function WorkoutCard({
  workout,
  onClick,
  onComplete,
  onCustomize,
  onSkip,
}: WorkoutCardProps) {
  const isDone = workout.status === 'completed' || workout.status === 'skipped';
  const accentClass = DISCIPLINE_COLORS[workout.discipline] || 'border-l-primary';

  return (
    <div
      className={`glass rounded-2xl p-5 mx-4 mb-3 border-l-3 ${accentClass} animate-fade-in transition-all duration-200 hover:bg-white/[0.06] ${
        isDone ? 'opacity-60' : ''
      }`}
    >
      <div className="cursor-pointer" onClick={onClick}>
        {/* Header row: badge + status icon */}
        <div className="flex items-center justify-between mb-2">
          <Badge discipline={workout.discipline} size="sm" />
          {workout.status === 'completed' && (
            <CheckCircle2 className="h-5 w-5 text-success drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
          )}
          {workout.status === 'skipped' && (
            <XCircle className="h-5 w-5 text-danger" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-text mb-1">
          {workout.title}
        </h3>

        {/* Duration + distance + time slot */}
        <div className="flex items-center gap-3 text-sm text-muted mb-2">
          <span>{formatDuration(workout.duration_minutes)}</span>
          {workout.distance != null && workout.distance_unit && (
            <>
              <span className="text-white/10">|</span>
              <span>{formatDistance(workout.distance, workout.distance_unit)}</span>
            </>
          )}
          <span className="text-white/10">|</span>
          <span>{TIME_SLOT_LABELS[workout.time_slot] ?? workout.time_slot}</span>
        </div>

        {/* Details preview */}
        {workout.details && (
          <p className="text-sm text-muted line-clamp-2">{workout.details}</p>
        )}
      </div>

      {/* Action buttons — Edit always visible, Complete/Skip only for pending */}
      <div className="mt-3 flex gap-2">
        {workout.status === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success/15 border border-success/20 py-2.5 text-sm font-medium text-success cursor-pointer hover:bg-success/25 transition-all duration-200 active:scale-[0.98]"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCustomize?.();
          }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary/15 border border-primary/20 py-2.5 text-sm font-medium text-primary cursor-pointer hover:bg-primary/25 transition-all duration-200 active:scale-[0.98]"
        >
          <Pencil className="h-4 w-4" />
          {isDone ? 'Edit' : 'Customize'}
        </button>
        {workout.status === 'pending' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSkip?.();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-danger/15 border border-danger/20 py-2.5 text-sm font-medium text-danger cursor-pointer hover:bg-danger/25 transition-all duration-200 active:scale-[0.98]"
          >
            <XCircle className="h-4 w-4" />
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
