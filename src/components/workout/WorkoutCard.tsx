import { CheckCircle2, XCircle } from 'lucide-react';
import type { Workout } from '@/types';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { formatDuration } from '@/utils/date';

interface WorkoutCardProps {
  workout: Workout;
  onClick?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
}

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
};

export default function WorkoutCard({
  workout,
  onClick,
  onComplete,
  onSkip,
}: WorkoutCardProps) {
  const isDone = workout.status === 'completed' || workout.status === 'skipped';

  return (
    <Card className={isDone ? 'opacity-60' : ''}>
      <div className="cursor-pointer" onClick={onClick}>
        {/* Header row: badge + status icon */}
        <div className="flex items-center justify-between mb-2">
          <Badge discipline={workout.discipline} size="sm" />
          {workout.status === 'completed' && (
            <CheckCircle2 className="h-5 w-5 text-success" />
          )}
          {workout.status === 'skipped' && (
            <XCircle className="h-5 w-5 text-danger" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-text mb-1">
          {workout.title}
        </h3>

        {/* Duration + time slot */}
        <div className="flex items-center gap-3 text-sm text-muted mb-2">
          <span>{formatDuration(workout.duration_minutes)}</span>
          <span className="text-surface-light">|</span>
          <span>{TIME_SLOT_LABELS[workout.time_slot] ?? workout.time_slot}</span>
        </div>

        {/* Details preview */}
        {workout.details && (
          <p className="text-sm text-muted line-clamp-2">{workout.details}</p>
        )}
      </div>

      {/* Action buttons */}
      {workout.status === 'pending' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success/20 py-2 text-sm font-medium text-success cursor-pointer hover:bg-success/30 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSkip?.();
            }}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-danger/20 py-2 text-sm font-medium text-danger cursor-pointer hover:bg-danger/30 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            Skip
          </button>
        </div>
      )}
    </Card>
  );
}
