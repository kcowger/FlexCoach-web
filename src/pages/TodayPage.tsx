import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PartyPopper, AlertCircle, MessageCircle, ChevronDown, Maximize2 } from 'lucide-react';
import { useAppStore } from '@/stores/useAppStore';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useMoodStore } from '@/stores/useMoodStore';
import MoodCheckIn from '@/components/mood/MoodCheckIn';
import WorkoutCard from '@/components/workout/WorkoutCard';
import WeekVolumeSummary from '@/components/workout/WeekVolumeSummary';
import CoachChat from '@/components/coach/CoachChat';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import {
  formatDate,
  getTodayISO,
  getWeekStartISO,
  addDays,
  formatDayOfWeek,
  getDayNumber,
} from '@/utils/date';
import { hasDistance, defaultDistanceUnit } from '@/utils/distance';
import type { Workout, Discipline, TimeSlot, DistanceUnit } from '@/types';

const DISCIPLINES: Discipline[] = ['swim', 'bike', 'run', 'strength', 'rest', 'recovery', 'brick'];
const TIME_SLOTS: TimeSlot[] = ['morning', 'midday', 'evening'];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const inputClasses =
  'bg-white/5 text-text border border-white/10 rounded-xl px-4 py-3 w-full focus:ring-2 focus:ring-primary/50 focus:border-primary/50 focus:outline-none transition-all';

export default function TodayPage() {
  const navigate = useNavigate();
  const pid = useAppStore((s) => s.activeProfileId)!;
  const {
    todayWorkouts,
    weekWorkouts,
    isGenerating,
    generationError,
    loadToday,
    loadWeek,
    generateWeek,
    markComplete,
    markSkipped,
    applyWorkoutUpdate,
  } = useWorkoutStore();

  const { todayMood, moodError, loadTodayMood, logMood, clearMoodError } = useMoodStore();

  const [skipModal, setSkipModal] = useState<{ workoutId: number } | null>(null);
  const [skipReason, setSkipReason] = useState('');

  // Day navigation
  const today = getTodayISO();
  const [selectedDate, setSelectedDate] = useState(today);
  const weekStart = getWeekStartISO(new Date(selectedDate + 'T00:00:00'));
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const isToday = selectedDate === today;

  // Customize modal
  const [customizeWorkout, setCustomizeWorkout] = useState<Workout | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDiscipline, setEditDiscipline] = useState<Discipline>('strength');
  const [editDuration, setEditDuration] = useState('60');
  const [editTimeSlot, setEditTimeSlot] = useState<TimeSlot>('morning');
  const [editDetails, setEditDetails] = useState('');
  const [editDistance, setEditDistance] = useState('');
  const [editDistanceUnit, setEditDistanceUnit] = useState<DistanceUnit>('mi');

  // Coach
  const [coachExpanded, setCoachExpanded] = useState(false);

  useEffect(() => {
    loadToday(pid, selectedDate);
    loadWeek(pid, weekStart);
    loadTodayMood(pid);
  }, [pid, selectedDate, weekStart, loadToday, loadWeek, loadTodayMood]);

  function handleComplete(workoutId: number) {
    markComplete(pid, workoutId);
  }

  function handleSkipConfirm() {
    if (!skipModal) return;
    markSkipped(pid, skipModal.workoutId, skipReason);
    setSkipModal(null);
    setSkipReason('');
  }

  async function handleGenerate() {
    try {
      await generateWeek(pid);
      loadToday(pid, selectedDate);
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
    loadToday(pid, selectedDate);
  }

  const allCompleted =
    todayWorkouts.length > 0 &&
    todayWorkouts.every((w) => w.status === 'completed');

  return (
    <div className="bg-transparent text-text min-h-full">
      <LoadingOverlay
        visible={isGenerating}
        message="Generating your plan..."
      />

      {/* Header */}
      <div className="px-6 pt-6 pb-2">
        {isToday && (
          <h1 className="text-xl font-bold gradient-text">{getGreeting()}</h1>
        )}
        <p className={`text-sm text-muted ${isToday ? 'mt-1' : 'mt-0'}`}>
          {formatDate(selectedDate)}
        </p>
      </div>

      {/* Day navigation strip */}
      <div className="flex px-4 mb-3">
        {weekDays.map((date) => {
          const isSelected = date === selectedDate;
          const isTodayDate = date === today;
          return (
            <button
              key={date}
              onClick={() => setSelectedDate(date)}
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
            </button>
          );
        })}
      </div>

      {/* Daily Mood Check-in */}
      {!todayMood ? (
        <MoodCheckIn
          title="How are you feeling today?"
          collapsible
          error={moodError}
          onSubmit={(data) => {
            clearMoodError();
            logMood(pid, data.mood, data.energy, data.sleep, 'daily', undefined, {
              sleepHours: data.sleepHours,
              stress: data.stress,
              restingHr: data.restingHr,
              weight: data.weight,
            });
          }}
        />
      ) : (
        <div className="mx-4 mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl glass px-4 py-3">
          <span className="text-xs text-muted">Today's check-in:</span>
          <span className="text-xs font-medium">
            Mood {todayMood.mood}/5 &middot; Energy {todayMood.energy}/5 &middot; Sleep {todayMood.sleep_quality}/5
            {todayMood.stress ? ` \u00b7 Stress ${todayMood.stress}/5` : ''}
            {todayMood.sleep_hours ? ` \u00b7 ${todayMood.sleep_hours}hrs` : ''}
          </span>
        </div>
      )}

      {/* Weekly Volume Summary */}
      {weekWorkouts.length > 0 && (
        <WeekVolumeSummary workouts={weekWorkouts} compact />
      )}

      {/* Error Banner */}
      {generationError && (
        <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl bg-danger/15 border border-danger/20 px-4 py-3 animate-fade-in">
          <AlertCircle className="h-5 w-5 text-danger flex-shrink-0" />
          <p className="text-sm text-danger">{generationError}</p>
        </div>
      )}

      {/* All Completed Congrats */}
      {allCompleted && (
        <div className="mx-4 mb-3 flex items-center gap-3 rounded-xl bg-success/10 border border-success/20 px-4 py-4 animate-fade-in">
          <PartyPopper className="h-6 w-6 text-success flex-shrink-0 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <div>
            <p className="font-semibold text-success">All done for today!</p>
            <p className="text-sm text-success/80">
              Great work completing all your workouts.
            </p>
          </div>
        </div>
      )}

      {/* Workout List */}
      {todayWorkouts.length > 0 ? (
        <div className="pb-2">
          {todayWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onClick={() => navigate(`/workout/${workout.id}`)}
              onComplete={() => handleComplete(workout.id)}
              onCustomize={() => openCustomize(workout)}
              onSkip={() => setSkipModal({ workoutId: workout.id })}
            />
          ))}
        </div>
      ) : (
        !isGenerating && (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center animate-fade-in">
            <p className="text-muted">
              {isToday
                ? 'No workouts for today. Generate your training plan to get started.'
                : 'No workouts scheduled for this day.'}
            </p>
            {isToday && (
              <div className="w-full max-w-xs">
                <Button
                  title="Generate Workouts"
                  variant="primary"
                  size="lg"
                  onClick={handleGenerate}
                  loading={isGenerating}
                />
              </div>
            )}
          </div>
        )
      )}

      {/* Coach Section */}
      <div className="mx-4 mb-3">
        <button
          onClick={() => setCoachExpanded(!coachExpanded)}
          className="cursor-pointer flex items-center justify-between w-full glass rounded-xl px-4 py-3 hover:bg-white/[0.06] transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Coach</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate('/coach');
              }}
              className="cursor-pointer text-xs text-primary hover:text-primary/80 transition-colors"
              title="Full screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <ChevronDown className={`h-4 w-4 text-muted transition-transform ${coachExpanded ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {coachExpanded && (
          <div className="mt-2 glass rounded-xl p-3 animate-fade-in">
            <CoachChat pid={pid} maxHeight="350px" />
          </div>
        )}
      </div>

      <div className="h-4" />

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
          {/* Title */}
          <div>
            <label className="text-xs text-muted mb-1 block">Title</label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={inputClasses}
            />
          </div>

          {/* Discipline */}
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

          {/* Duration */}
          <div>
            <label className="text-xs text-muted mb-1 block">Duration (minutes)</label>
            <input
              type="number"
              value={editDuration}
              onChange={(e) => setEditDuration(e.target.value)}
              className={inputClasses}
            />
          </div>

          {/* Distance */}
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

          {/* Time Slot */}
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

          {/* Details */}
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
            <Button
              title="Cancel"
              variant="outline"
              size="sm"
              onClick={() => setCustomizeWorkout(null)}
            />
            <Button
              title="Save Changes"
              variant="primary"
              size="sm"
              onClick={saveCustomize}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
