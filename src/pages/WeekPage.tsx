import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import WorkoutCard from '@/components/workout/WorkoutCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { getWeekStartISO, addDays, formatDateShort } from '@/utils/date';
import type { Workout } from '@/types';

export default function WeekPage() {
  const navigate = useNavigate();
  const pid = useAppStore((s) => s.activeProfileId)!;
  const {
    weekWorkouts,
    isGenerating,
    generationError,
    loadWeek,
    generateWeek,
    markComplete,
    markSkipped,
  } = useWorkoutStore();

  const [weekStart, setWeekStart] = useState(() => getWeekStartISO());
  const [skipModal, setSkipModal] = useState<{ workoutId: number } | null>(null);
  const [skipReason, setSkipReason] = useState('');

  useEffect(() => {
    loadWeek(pid, weekStart);
  }, [pid, weekStart, loadWeek]);

  function handlePrevWeek() {
    setWeekStart((ws) => addDays(ws, -7));
  }

  function handleNextWeek() {
    setWeekStart((ws) => addDays(ws, 7));
  }

  function handleComplete(workoutId: number) {
    markComplete(pid, workoutId);
  }

  function handleSkipConfirm() {
    if (!skipModal) return;
    markSkipped(pid, skipModal.workoutId, skipReason);
    setSkipModal(null);
    setSkipReason('');
  }

  async function handleGenerateWeek() {
    try {
      await generateWeek(pid, weekStart);
    } catch {
      // Error is stored in generationError
    }
  }

  // Group workouts by date
  const groupedByDate: Record<string, Workout[]> = {};
  for (const workout of weekWorkouts) {
    if (!groupedByDate[workout.date]) {
      groupedByDate[workout.date] = [];
    }
    groupedByDate[workout.date].push(workout);
  }
  const sortedDates = Object.keys(groupedByDate).sort();

  const weekEnd = addDays(weekStart, 6);
  const weekRangeLabel = `${formatDateShort(weekStart)} - ${formatDateShort(weekEnd)}`;

  return (
    <div className="bg-transparent text-text min-h-full">
      <LoadingOverlay
        visible={isGenerating}
        message="Generating this week's plan..."
      />

      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-xl font-bold gradient-text mb-1">This Week</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevWeek}
            className="cursor-pointer rounded-lg glass p-1.5 text-muted hover:text-text transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm text-muted flex-1 text-center">
            {weekRangeLabel}
          </span>
          <button
            onClick={handleNextWeek}
            className="cursor-pointer rounded-lg glass p-1.5 text-muted hover:text-text transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {generationError && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-danger/15 border border-danger/20 px-4 py-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{generationError}</p>
        </div>
      )}

      {/* No Workouts */}
      {weekWorkouts.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <p className="text-muted">
            No workouts scheduled for this week.
          </p>
          <Button
            title="Generate Week"
            variant="primary"
            size="lg"
            onClick={handleGenerateWeek}
            loading={isGenerating}
          />
        </div>
      )}

      {/* Grouped Workouts */}
      <div className="pb-4">
        {sortedDates.map((date) => (
          <div key={date}>
            {/* Date Header */}
            <div className="px-6 pt-3 pb-1">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">
                {formatDateShort(date)}
              </h2>
            </div>

            {/* Workouts for this date */}
            {groupedByDate[date].map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onClick={() => navigate(`/workout/${workout.id}`)}
                onComplete={() => handleComplete(workout.id)}
                onSkip={() => setSkipModal({ workoutId: workout.id })}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Skip Reason Modal */}
      <Modal
        open={!!skipModal}
        onClose={() => {
          setSkipModal(null);
          setSkipReason('');
        }}
        title="Skip Workout"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">
            Why are you skipping this workout?
          </p>
          <input
            type="text"
            placeholder="e.g., Feeling under the weather"
            value={skipReason}
            onChange={(e) => setSkipReason(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSkipConfirm();
            }}
            className="bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => {
                setSkipModal(null);
                setSkipReason('');
              }}
            />
            <Button
              title="Skip"
              variant="danger"
              size="sm"
              onClick={handleSkipConfirm}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
