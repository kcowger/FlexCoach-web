import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, PartyPopper, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useMoodStore } from '@/stores/useMoodStore';
import MoodCheckIn from '@/components/mood/MoodCheckIn';
import WorkoutCard from '@/components/workout/WorkoutCard';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { formatDate, getTodayISO } from '@/utils/date';

export default function TodayPage() {
  const navigate = useNavigate();
  const pid = useAppStore((s) => s.activeProfileId)!;
  const {
    todayWorkouts,
    currentBlock,
    isGenerating,
    generationError,
    loadToday,
    loadCurrentBlock,
    generateBlock,
    generateWeek,
    markComplete,
    markSkipped,
  } = useWorkoutStore();

  const { todayMood, loadTodayMood, logMood } = useMoodStore();

  const [skipModal, setSkipModal] = useState<{ workoutId: number } | null>(null);
  const [skipReason, setSkipReason] = useState('');

  useEffect(() => {
    loadToday(pid);
    loadCurrentBlock(pid);
    loadTodayMood(pid);
  }, [pid, loadToday, loadCurrentBlock, loadTodayMood]);

  function handleRefresh() {
    loadToday(pid);
    loadCurrentBlock(pid);
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

  async function handleGenerateBlock() {
    try {
      await generateBlock(pid);
    } catch {
      // Error is stored in generationError
    }
  }

  async function handleGenerateWeek() {
    try {
      await generateWeek(pid);
    } catch {
      // Error is stored in generationError
    }
  }

  const allCompleted =
    todayWorkouts.length > 0 &&
    todayWorkouts.every((w) => w.status === 'completed');

  const today = getTodayISO();

  return (
    <div className="bg-background text-text min-h-full">
      <LoadingOverlay
        visible={isGenerating}
        message="Generating your plan..."
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold text-text">Today</h1>
          <p className="text-sm text-muted">{formatDate(today)}</p>
        </div>
        <button
          onClick={handleRefresh}
          className="cursor-pointer rounded-xl bg-surface p-2.5 text-muted hover:text-text transition-colors"
          title="Refresh"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Daily Mood Check-in */}
      {!todayMood ? (
        <MoodCheckIn
          title="How are you feeling today?"
          onSubmit={(mood, energy, sleep) =>
            logMood(pid, mood, energy, sleep, 'daily')
          }
        />
      ) : (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-surface px-4 py-3">
          <span className="text-xs text-muted">Today's check-in:</span>
          <span className="text-xs font-medium">
            Mood {todayMood.mood}/5 &middot; Energy {todayMood.energy}/5 &middot; Sleep {todayMood.sleep_quality}/5
          </span>
        </div>
      )}

      {/* Error Banner */}
      {generationError && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-danger/20 px-4 py-3">
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{generationError}</p>
        </div>
      )}

      {/* No Block State */}
      {!currentBlock && !isGenerating && (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <p className="text-muted">
            No training block found. Generate a training block to get started.
          </p>
          <Button
            title="Generate Training Block"
            variant="primary"
            size="lg"
            onClick={handleGenerateBlock}
            loading={isGenerating}
          />
        </div>
      )}

      {/* Block Exists but No Today Workouts */}
      {currentBlock && todayWorkouts.length === 0 && !isGenerating && (
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          <p className="text-muted">
            No workouts scheduled for today. Generate this week's plan.
          </p>
          <Button
            title="Generate This Week"
            variant="primary"
            size="lg"
            onClick={handleGenerateWeek}
            loading={isGenerating}
          />
        </div>
      )}

      {/* All Completed Congrats */}
      {allCompleted && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-success/20 px-4 py-4">
          <PartyPopper className="h-6 w-6 text-success flex-shrink-0" />
          <div>
            <p className="font-semibold text-success">All done for today!</p>
            <p className="text-sm text-success/80">
              Great work completing all your workouts.
            </p>
          </div>
        </div>
      )}

      {/* Workout List */}
      <div className="pb-4">
        {todayWorkouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            onClick={() => navigate(`/workout/${workout.id}`)}
            onComplete={() => handleComplete(workout.id)}
            onSkip={() => setSkipModal({ workoutId: workout.id })}
          />
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
            className="bg-surface text-text border border-surface-light rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary focus:outline-none"
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
