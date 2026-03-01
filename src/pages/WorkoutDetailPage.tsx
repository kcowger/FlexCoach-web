import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useMoodStore } from '@/stores/useMoodStore';
import { getWorkoutById } from '@/storage/repository';
import MoodCheckIn from '@/components/mood/MoodCheckIn';
import PostWorkoutCheckIn from '@/components/workout/PostWorkoutCheckIn';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDate, formatDuration } from '@/utils/date';
import type { Workout } from '@/types';

const TIME_SLOT_LABELS: Record<string, string> = {
  morning: 'Morning',
  midday: 'Midday',
  evening: 'Evening',
};

const inputClasses =
  'bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all';

export default function WorkoutDetailPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const pid = useAppStore((s) => s.activeProfileId)!;
  const { markComplete, markSkipped, updateNotes, updatePostWorkoutData } = useWorkoutStore();
  const { checkWorkoutMood, logMood, moodError, clearMoodError } = useMoodStore();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [workoutMoodLogged, setWorkoutMoodLogged] = useState(false);

  const [showPostWorkout, setShowPostWorkout] = useState(false);
  const [skipModal, setSkipModal] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  useEffect(() => {
    if (!workoutId) {
      setNotFound(true);
      return;
    }
    const w = getWorkoutById(pid, Number(workoutId));
    if (!w) {
      setNotFound(true);
    } else {
      setWorkout(w);
      setNotes(w.notes || '');
      const existing = checkWorkoutMood(pid, w.id);
      setWorkoutMoodLogged(!!existing);
    }
  }, [pid, workoutId, checkWorkoutMood]);

  function reloadWorkout() {
    if (!workoutId) return;
    const w = getWorkoutById(pid, Number(workoutId));
    if (w) {
      setWorkout(w);
      setNotes(w.notes || '');
    }
  }

  function handleComplete() {
    if (!workout) return;
    markComplete(pid, workout.id);
    reloadWorkout();
    setShowPostWorkout(true);
  }

  function handleSkipConfirm() {
    if (!workout) return;
    markSkipped(pid, workout.id, skipReason);
    setSkipModal(false);
    setSkipReason('');
    reloadWorkout();
  }

  function handleSaveNotes() {
    if (!workout) return;
    updateNotes(pid, workout.id, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  if (notFound) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="h-12 w-12 text-muted" />
        <p className="text-lg font-semibold text-text">Workout not found</p>
        <p className="text-sm text-muted">
          This workout may have been removed or doesn't exist.
        </p>
        <Button
          title="Go Back"
          variant="primary"
          size="md"
          onClick={() => navigate(-1)}
        />
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="cursor-pointer rounded-xl glass p-2.5 text-muted hover:text-text transition-all duration-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-text flex-1">Workout Details</h1>
      </div>

      {/* Workout Info */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <Badge discipline={workout.discipline} />
          {workout.status === 'completed' && (
            <div className="flex items-center gap-1.5 text-success">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
          {workout.status === 'skipped' && (
            <div className="flex items-center gap-1.5 text-danger">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Skipped</span>
            </div>
          )}
        </div>

        <h2 className="text-lg font-bold text-text mb-2">{workout.title}</h2>

        <div className="flex flex-wrap items-center gap-3 text-sm text-muted mb-3">
          <span>{formatDate(workout.date)}</span>
          <span className="text-white/10">|</span>
          <span>{TIME_SLOT_LABELS[workout.time_slot] ?? workout.time_slot}</span>
          <span className="text-white/10">|</span>
          <span>{formatDuration(workout.duration_minutes)}</span>
        </div>

        {workout.skip_reason && (
          <div className="rounded-xl bg-danger/10 px-3 py-2 mb-3">
            <p className="text-sm text-danger">
              <span className="font-medium">Skip reason:</span> {workout.skip_reason}
            </p>
          </div>
        )}

        {workout.completed_at && (
          <p className="text-xs text-muted mb-3">
            Completed at {new Date(workout.completed_at).toLocaleString()}
          </p>
        )}

        {workout.rpe && (
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            <span>RPE: <span className="font-medium text-text">{workout.rpe}/10</span></span>
            {workout.actual_duration && (
              <>
                <span className="text-white/10">|</span>
                <span>Actual: <span className="font-medium text-text">{workout.actual_duration}min</span></span>
                {workout.actual_duration !== workout.duration_minutes && (
                  <span className="text-xs">
                    ({workout.actual_duration > workout.duration_minutes ? '+' : ''}
                    {workout.actual_duration - workout.duration_minutes}min vs planned)
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </Card>

      {/* Pre-workout Mood Check-in */}
      {workout.status === 'pending' && !workoutMoodLogged && (
        <MoodCheckIn
          title="Pre-workout check-in"
          error={moodError}
          onSubmit={(data) => {
            clearMoodError();
            logMood(pid, data.mood, data.energy, data.sleep, 'pre_workout', workout.id, {
              stress: data.stress,
            });
            setWorkoutMoodLogged(true);
          }}
        />
      )}

      {/* Post-workout Check-in */}
      {showPostWorkout && workout.status === 'completed' && !workout.rpe && (
        <PostWorkoutCheckIn
          plannedDuration={workout.duration_minutes}
          onSubmit={(rpe, actualDuration) => {
            updatePostWorkoutData(pid, workout.id, rpe, actualDuration);
            setShowPostWorkout(false);
            reloadWorkout();
          }}
          onSkip={() => setShowPostWorkout(false)}
        />
      )}

      {/* Details */}
      {workout.details && (
        <Card>
          <h3 className="text-base font-semibold text-text mb-2">Details</h3>
          <ul className="list-disc list-inside space-y-1">
            {(workout.details.includes('\n')
              ? workout.details.split('\n')
              : workout.details.split('. ').map((s, i, arr) => (i < arr.length - 1 ? s + '.' : s))
            )
              .filter((line) => line.trim())
              .map((line, i) => (
                <li key={i} className="text-sm text-muted">{line.trim()}</li>
              ))}
          </ul>
        </Card>
      )}

      {/* Why this workout? */}
      {workout.why && (
        <Card>
          <h3 className="text-base font-semibold text-text mb-2">Why this workout?</h3>
          <p className="text-sm text-muted">{workout.why}</p>
        </Card>
      )}

      {/* Status Actions */}
      {workout.status === 'pending' && (
        <Card>
          <h3 className="text-base font-semibold text-text mb-3">Actions</h3>
          <div className="flex gap-3">
            <button
              onClick={handleComplete}
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-success/15 border border-success/20 py-3 text-sm font-semibold text-success hover:bg-success/25 transition-all duration-200 active:scale-[0.98]"
            >
              <CheckCircle2 className="h-5 w-5" />
              Complete
            </button>
            <button
              onClick={() => setSkipModal(true)}
              className="cursor-pointer flex flex-1 items-center justify-center gap-2 rounded-xl bg-danger/15 border border-danger/20 py-3 text-sm font-semibold text-danger hover:bg-danger/25 transition-all duration-200 active:scale-[0.98]"
            >
              <XCircle className="h-5 w-5" />
              Skip
            </button>
          </div>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <h3 className="text-base font-semibold text-text mb-2">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add notes about this workout..."
          className={`${inputClasses} resize-none`}
        />
        <div className="flex items-center justify-end gap-2 pt-3">
          {notesSaved && (
            <span className="text-sm text-success">Saved!</span>
          )}
          <Button
            title="Save Notes"
            variant="primary"
            size="sm"
            onClick={handleSaveNotes}
          />
        </div>
      </Card>

      {/* Skip Reason Modal */}
      <Modal
        open={skipModal}
        onClose={() => {
          setSkipModal(false);
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
            className={inputClasses}
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => {
                setSkipModal(false);
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
