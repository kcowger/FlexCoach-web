import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import WorkoutCard from '@/components/workout/WorkoutCard';
import SwapWorkoutModal from '@/components/workout/SwapWorkoutModal';
import WeekVolumeSummary from '@/components/workout/WeekVolumeSummary';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  getWeekStartISO,
  addDays,
  formatDateShort,
  formatDayOfWeek,
  getDayNumber,
  getTodayISO,
} from '@/utils/date';
import { hasDistance, defaultDistanceUnit } from '@/utils/distance';
import type { Workout, Discipline, TimeSlot, DistanceUnit } from '@/types';

const DISCIPLINES: Discipline[] = ['swim', 'bike', 'run', 'strength', 'rest', 'recovery', 'brick'];
const TIME_SLOTS: TimeSlot[] = ['morning', 'midday', 'evening'];

const inputClasses =
  'bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all';

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
    applyWorkoutUpdate,
  } = useWorkoutStore();

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    return day === 0 ? 6 : day - 1;
  });

  const [skipModal, setSkipModal] = useState<{ workoutId: number } | null>(null);
  const [skipReason, setSkipReason] = useState('');

  // Customize modal
  const [customizeWorkout, setCustomizeWorkout] = useState<Workout | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDiscipline, setEditDiscipline] = useState<Discipline>('strength');
  const [editDuration, setEditDuration] = useState('60');
  const [editTimeSlot, setEditTimeSlot] = useState<TimeSlot>('morning');
  const [editDetails, setEditDetails] = useState('');
  const [editDistance, setEditDistance] = useState('');
  const [editDistanceUnit, setEditDistanceUnit] = useState<DistanceUnit>('mi');

  // Swap modal
  const [swapWorkout, setSwapWorkout] = useState<Workout | null>(null);

  const weekStart = getWeekStartISO(
    new Date(Date.now() + weekOffset * 7 * 24 * 60 * 60 * 1000)
  );
  const today = getTodayISO();

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const selectedDate = weekDays[selectedDayIndex];

  useEffect(() => {
    loadWeek(pid, weekStart);
  }, [pid, weekStart, loadWeek]);

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

  function openCustomize(workout: Workout) {
    setCustomizeWorkout(workout);
    setEditTitle(workout.title);
    setEditDiscipline(workout.discipline);
    setEditDuration(String(workout.duration_minutes));
    setEditTimeSlot(workout.time_slot);
    setEditDetails(workout.details);
    setEditDistance(workout.distance ? String(workout.distance) : '');
    setEditDistanceUnit(workout.distance_unit || defaultDistanceUnit(workout.discipline) || 'mi');
  }

  function saveCustomize() {
    if (!customizeWorkout) return;
    applyWorkoutUpdate(pid, customizeWorkout.id, {
      title: editTitle,
      discipline: editDiscipline,
      durationMinutes: parseInt(editDuration, 10) || 60,
      timeSlot: editTimeSlot,
      details: editDetails,
      distance: editDistance ? parseFloat(editDistance) : undefined,
      distanceUnit: hasDistance(editDiscipline) ? editDistanceUnit : undefined,
    });
    setCustomizeWorkout(null);
    loadWeek(pid, weekStart);
  }

  function handleSwapAccept(changes: Record<string, unknown>) {
    if (!swapWorkout) return;
    applyWorkoutUpdate(pid, swapWorkout.id, changes);
    setSwapWorkout(null);
    loadWeek(pid, weekStart);
  }

  // Group workouts by day
  const workoutsByDay: Record<string, Workout[]> = {};
  for (const date of weekDays) {
    workoutsByDay[date] = weekWorkouts.filter((w) => w.date === date);
  }

  const hasWorkouts = weekWorkouts.length > 0;
  const selectedDayWorkouts = workoutsByDay[selectedDate] || [];

  return (
    <div className="bg-transparent text-text min-h-full">
      <LoadingOverlay
        visible={isGenerating}
        message="Generating this week's plan..."
      />

      {/* Header with week nav */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="cursor-pointer rounded-lg glass p-1.5 text-muted hover:text-text transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold gradient-text">
              Week of {formatDateShort(weekStart)}
            </h1>
          </div>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="cursor-pointer rounded-lg glass p-1.5 text-muted hover:text-text transition-all duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="cursor-pointer block mx-auto mt-1 text-primary text-xs"
          >
            Back to this week
          </button>
        )}
      </div>

      {/* Horizontal day strip */}
      <div className="flex px-4 mb-3">
        {weekDays.map((date, i) => {
          const isSelected = i === selectedDayIndex;
          const isTodayDate = date === today;
          const dayHasWorkouts = (workoutsByDay[date] || []).length > 0;

          return (
            <button
              key={date}
              onClick={() => setSelectedDayIndex(i)}
              className="cursor-pointer flex-1 flex flex-col items-center py-2"
            >
              <span
                className={`text-xs font-semibold mb-1 ${
                  isSelected ? 'text-primary' : 'text-muted'
                }`}
              >
                {formatDayOfWeek(date)}
              </span>
              <span
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  isSelected
                    ? 'bg-primary text-white'
                    : isTodayDate
                      ? 'border-2 border-primary text-primary'
                      : 'text-text'
                }`}
              >
                {getDayNumber(date)}
              </span>
              {dayHasWorkouts && !isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
              )}
              {!dayHasWorkouts && !isSelected && <span className="h-1.5 mt-1" />}
            </button>
          );
        })}
      </div>

      {/* Error Banner */}
      {generationError && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-danger/15 border border-danger/20 px-4 py-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{generationError}</p>
        </div>
      )}

      {/* Volume summary — planned vs completed */}
      {hasWorkouts && <WeekVolumeSummary workouts={weekWorkouts} />}

      {/* Selected day's workouts */}
      {hasWorkouts ? (
        <div>
          <div className="px-6 mb-2">
            <h2 className="text-sm font-semibold text-muted">
              {formatDateShort(selectedDate)}
            </h2>
          </div>
          {selectedDayWorkouts.length > 0 ? (
            selectedDayWorkouts.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onClick={() => navigate(`/workout/${w.id}`)}
                onComplete={() => handleComplete(w.id)}
                onCustomize={() => openCustomize(w)}
                onSwap={() => setSwapWorkout(w)}
                onSkip={() => setSkipModal({ workoutId: w.id })}
              />
            ))
          ) : (
            <div className="mx-4 glass rounded-xl px-4 py-6 flex items-center justify-center">
              <p className="text-muted text-sm italic">Rest day</p>
            </div>
          )}
        </div>
      ) : (
        !isGenerating && (
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
        )
      )}

      <div className="h-8" />

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
            className={inputClasses}
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

      {/* Customize Modal */}
      <Modal
        open={!!customizeWorkout}
        onClose={() => setCustomizeWorkout(null)}
        title={customizeWorkout ? (customizeWorkout.status === 'pending' ? 'Customize Workout' : 'Edit Workout') : ''}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label className="text-xs text-muted mb-1 block">Title</label>
            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputClasses} />
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Discipline</label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setEditDiscipline(d);
                    const unit = defaultDistanceUnit(d);
                    if (unit) setEditDistanceUnit(unit);
                  }}
                  className={`cursor-pointer px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-colors ${
                    editDiscipline === d
                      ? 'bg-primary text-white'
                      : 'bg-white/5 border border-white/10 text-muted hover:text-text'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Duration (minutes)</label>
            <input type="number" value={editDuration} onChange={(e) => setEditDuration(e.target.value)} className={inputClasses} />
          </div>
          {hasDistance(editDiscipline) && (
            <div>
              <label className="text-xs text-muted mb-1 block">Distance ({editDistanceUnit})</label>
              <input
                type="number"
                step={editDistanceUnit === 'mi' || editDistanceUnit === 'km' ? '0.1' : '1'}
                value={editDistance}
                onChange={(e) => setEditDistance(e.target.value)}
                placeholder="e.g. 3.1"
                className={inputClasses}
              />
            </div>
          )}
          <div>
            <label className="text-xs text-muted mb-1 block">Time Slot</label>
            <div className="flex gap-2">
              {TIME_SLOTS.map((ts) => (
                <button
                  key={ts}
                  type="button"
                  onClick={() => setEditTimeSlot(ts)}
                  className={`cursor-pointer flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    editTimeSlot === ts
                      ? 'bg-primary text-white'
                      : 'bg-white/5 border border-white/10 text-muted hover:text-text'
                  }`}
                >
                  {ts}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-muted mb-1 block">Details</label>
            <textarea
              value={editDetails}
              onChange={(e) => setEditDetails(e.target.value)}
              rows={4}
              className={`${inputClasses} resize-none`}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button title="Cancel" variant="outline" size="sm" onClick={() => setCustomizeWorkout(null)} />
            <Button title="Save Changes" variant="primary" size="sm" onClick={saveCustomize} />
          </div>
        </div>
      </Modal>

      {/* Swap Workout Modal */}
      {swapWorkout && (
        <SwapWorkoutModal
          open={!!swapWorkout}
          workout={swapWorkout}
          pid={pid}
          onClose={() => setSwapWorkout(null)}
          onAccept={handleSwapAccept}
        />
      )}
    </div>
  );
}
