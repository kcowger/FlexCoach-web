import {
  getProfileData,
  updateProfileData,
  getSchedule,
  setSchedule,
  getEvents as dsGetEvents,
  setEvents as dsSetEvents,
  getPlans,
  setPlans,
  getWorkouts,
  setWorkouts,
  getChatData,
  setChatData,
  getMoodData,
  setMoodData,
  getBenchmarksData,
  setBenchmarksData,
  nextId,
} from '@/lib/dataSync';
import { getTodayISO, addDays } from '@/utils/date';
import type {
  UserProfile,
  SchedulePreference,
  TrainingEvent,
  WorkoutPlan,
  Workout,
  ChatMessage,
  MoodEntry,
  MoodContext,
  Benchmarks,
  WeightUnit,
} from '@/types';

// ── User Profile ──────────────────────────────────────────────────────

export function getProfile(pid: string): UserProfile {
  return getProfileData(pid);
}

export function updateProfile(
  pid: string,
  updates: Partial<Pick<UserProfile,
    'name' | 'equipment' | 'injuries' | 'goals' | 'experience_level' |
    'weekly_hours_available' | 'travel_mode' | 'api_key_configured' | 'onboarding_complete' |
    'age' | 'weight' | 'weight_unit' | 'height_cm' | 'height_unit' | 'sex'
  >>
): void {
  updateProfileData(pid, updates);
}

// ── Schedule Preferences ──────────────────────────────────────────────

export function getSchedulePreferences(pid: string): SchedulePreference[] {
  return getSchedule(pid);
}

export function getAvailableSlots(pid: string): SchedulePreference[] {
  return getSchedulePreferences(pid).filter((s) => s.available);
}

export function upsertSchedulePreference(
  pid: string,
  dayOfWeek: number,
  timeSlot: string,
  available: boolean,
  maxDuration: number = 60
): void {
  const schedule = getSchedule(pid);
  const idx = schedule.findIndex((s) => s.day_of_week === dayOfWeek && s.time_slot === timeSlot);
  const entry: SchedulePreference = {
    id: idx >= 0 ? schedule[idx].id : nextId(),
    day_of_week: dayOfWeek,
    time_slot: timeSlot as SchedulePreference['time_slot'],
    available: available ? 1 : 0,
    max_duration_minutes: maxDuration,
  };
  if (idx >= 0) {
    schedule[idx] = entry;
  } else {
    schedule.push(entry);
  }
  setSchedule(pid, schedule);
}

// ── Events ────────────────────────────────────────────────────────────

export function getEvents(pid: string): TrainingEvent[] {
  return dsGetEvents(pid).sort(
    (a, b) => a.event_date.localeCompare(b.event_date)
  );
}

export function getUpcomingEvents(pid: string): TrainingEvent[] {
  const today = getTodayISO();
  return getEvents(pid).filter((e) => e.event_date >= today);
}

export function createEvent(
  pid: string,
  event: Omit<TrainingEvent, 'id' | 'created_at'>
): number {
  const events = dsGetEvents(pid);
  const id = nextId();
  events.push({ ...event, id, created_at: new Date().toISOString() });
  dsSetEvents(pid, events);
  return id;
}

export function deleteEvent(pid: string, id: number): void {
  const events = dsGetEvents(pid).filter((e) => e.id !== id);
  dsSetEvents(pid, events);
}

// ── Workout Plans ─────────────────────────────────────────────────────

export function getWeekPlan(pid: string, weekStartDate: string): WorkoutPlan | null {
  const plans = getPlans(pid);
  return plans.find((p) => p.week_start_date === weekStartDate) || null;
}

export function saveWeekPlan(
  pid: string,
  weekNumber: number,
  weekStartDate: string,
  planJson: string,
  generationContext: string = ''
): number {
  const plans = getPlans(pid);
  const existing = plans.findIndex((p) => p.week_start_date === weekStartDate);
  const id = existing >= 0 ? plans[existing].id : nextId();
  const plan: WorkoutPlan = {
    id,
    week_number: weekNumber,
    week_start_date: weekStartDate,
    plan_json: planJson,
    generated_at: new Date().toISOString(),
    generation_context: generationContext,
  };
  if (existing >= 0) {
    plans[existing] = plan;
  } else {
    plans.push(plan);
  }
  setPlans(pid, plans);
  return id;
}

// ── Workouts ──────────────────────────────────────────────────────────

export function getTodayWorkouts(pid: string, date: string): Workout[] {
  return getWorkouts(pid)
    .filter((w) => w.date === date)
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
}

export function getWeekWorkouts(pid: string, weekStart: string): Workout[] {
  const weekEnd = addDays(weekStart, 7);
  return getWorkouts(pid)
    .filter((w) => w.date >= weekStart && w.date < weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time_slot.localeCompare(b.time_slot));
}

export function getWorkoutById(pid: string, id: number): Workout | null {
  return getWorkouts(pid).find((w) => w.id === id) || null;
}

export function saveWorkouts(
  pid: string,
  planId: number,
  workouts: Array<{
    date: string;
    time_slot: string;
    discipline: string;
    title: string;
    duration_minutes: number;
    details: string;
    why?: string;
    structured_data?: string;
  }>
): void {
  const all = getWorkouts(pid);
  for (const w of workouts) {
    const existingIdx = all.findIndex(
      (existing) => existing.date === w.date && existing.time_slot === w.time_slot
    );
    const workout: Workout = {
      id: existingIdx >= 0 ? all[existingIdx].id : nextId(),
      plan_id: planId,
      date: w.date,
      time_slot: w.time_slot as Workout['time_slot'],
      discipline: w.discipline as Workout['discipline'],
      title: w.title,
      duration_minutes: w.duration_minutes,
      details: w.details,
      structured_data: w.structured_data || '',
      status: 'pending',
      skip_reason: '',
      completed_at: null,
      notes: '',
      why: w.why || '',
    };
    if (existingIdx >= 0) {
      all[existingIdx] = workout;
    } else {
      all.push(workout);
    }
  }
  setWorkouts(pid, all);
}

export function updateWorkoutStatus(
  pid: string,
  id: number,
  status: 'completed' | 'skipped',
  skipReason: string = ''
): void {
  const all = getWorkouts(pid);
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return;
  all[idx].status = status;
  if (status === 'completed') {
    all[idx].completed_at = new Date().toISOString();
  } else {
    all[idx].skip_reason = skipReason;
  }
  setWorkouts(pid, all);
}

export function updateWorkoutNotes(pid: string, id: number, notes: string): void {
  const all = getWorkouts(pid);
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return;
  all[idx].notes = notes;
  setWorkouts(pid, all);
}

export function getRecentWorkouts(pid: string, days: number = 14): Workout[] {
  const cutoff = addDays(getTodayISO(), -days);
  return getWorkouts(pid)
    .filter((w) => w.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function updateWorkoutDetails(
  pid: string,
  id: number,
  updates: Record<string, string | number>
): void {
  const all = getWorkouts(pid);
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return;

  const allowed = ['discipline', 'title', 'duration_minutes', 'details', 'time_slot', 'why'] as const;
  for (const key of allowed) {
    if (key in updates) {
      (all[idx] as unknown as Record<string, unknown>)[key] = updates[key];
    }
  }
  setWorkouts(pid, all);
}

// ── Chat Messages ─────────────────────────────────────────────────────

export function getChatMessages(pid: string, limit: number = 50): ChatMessage[] {
  const all = getChatData(pid);
  return all.slice(-limit);
}

export function saveChatMessage(
  pid: string,
  role: 'user' | 'assistant',
  content: string,
  contextSnapshot: string = ''
): number {
  const all = getChatData(pid);
  const id = nextId();
  all.push({
    id,
    role,
    content,
    timestamp: new Date().toISOString(),
    context_snapshot: contextSnapshot,
  });
  setChatData(pid, all);
  return id;
}

export function clearChatHistory(pid: string): void {
  setChatData(pid, []);
}

// ── Mood Entries ──────────────────────────────────────────────────────

export function getMoodEntries(pid: string): MoodEntry[] {
  return getMoodData(pid);
}

export function getTodayMood(pid: string, date: string): MoodEntry | null {
  return getMoodData(pid).find(
    (m) => m.date === date && m.context === 'daily'
  ) || null;
}

export function getWorkoutMood(pid: string, workoutId: number): MoodEntry | null {
  return getMoodData(pid).find(
    (m) => m.workout_id === workoutId && m.context === 'pre_workout'
  ) || null;
}

export function getRecentMoodEntries(pid: string, days: number = 14): MoodEntry[] {
  const cutoff = addDays(getTodayISO(), -days);
  return getMoodData(pid)
    .filter((m) => m.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function saveMoodEntry(
  pid: string,
  mood: number,
  energy: number,
  sleepQuality: number,
  context: MoodContext,
  workoutId?: number,
  extra?: {
    sleepHours?: number;
    stress?: number;
    restingHr?: number;
    weight?: number;
    weightUnit?: WeightUnit;
  }
): number {
  const entries = getMoodData(pid);
  const id = nextId();
  const entry: MoodEntry = {
    id,
    date: getTodayISO(),
    mood,
    energy,
    sleep_quality: sleepQuality,
    context,
    created_at: new Date().toISOString(),
  };
  // Only set optional fields if defined — Firestore rejects undefined values
  if (extra?.sleepHours != null) entry.sleep_hours = extra.sleepHours;
  if (extra?.stress != null) entry.stress = extra.stress;
  if (extra?.restingHr != null) entry.resting_hr = extra.restingHr;
  if (extra?.weight != null) entry.weight = extra.weight;
  if (extra?.weightUnit != null) entry.weight_unit = extra.weightUnit;
  if (workoutId != null) entry.workout_id = workoutId;
  entries.push(entry);
  setMoodData(pid, entries);
  return id;
}

// ── Post-workout Data ────────────────────────────────────────────────

export function updateWorkoutPostData(
  pid: string,
  workoutId: number,
  rpe: number,
  actualDuration: number
): void {
  const all = getWorkouts(pid);
  const idx = all.findIndex((w) => w.id === workoutId);
  if (idx < 0) return;
  all[idx].rpe = rpe;
  all[idx].actual_duration = actualDuration;
  setWorkouts(pid, all);
}

// ── Benchmarks ───────────────────────────────────────────────────────

export function getBenchmarks(pid: string): Benchmarks {
  return getBenchmarksData(pid);
}

export function updateBenchmarks(pid: string, updates: Partial<Benchmarks>): void {
  const current = getBenchmarksData(pid);
  setBenchmarksData(pid, { ...current, ...updates });
}

// ── Weight Log ───────────────────────────────────────────────────────

export function getWeightLog(pid: string, days: number = 30): Array<{ date: string; weight: number; unit: WeightUnit }> {
  const cutoff = addDays(getTodayISO(), -days);
  return getMoodData(pid)
    .filter((m) => m.weight && m.date >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, weight: m.weight!, unit: m.weight_unit || 'lbs' }));
}
