import { profileKey, nextId } from './keys';
import { getTodayISO, addDays } from '@/utils/date';
import type {
  UserProfile,
  SchedulePreference,
  TrainingEvent,
  TrainingBlock,
  WorkoutPlan,
  Workout,
  ChatMessage,
} from '@/types';

// ── Helpers ───────────────────────────────────────────────────────────

function getArray<T>(pid: string, key: Parameters<typeof profileKey>[1]): T[] {
  return JSON.parse(localStorage.getItem(profileKey(pid, key)) || '[]');
}

function setArray<T>(pid: string, key: Parameters<typeof profileKey>[1], data: T[]): void {
  localStorage.setItem(profileKey(pid, key), JSON.stringify(data));
}

// ── User Profile ──────────────────────────────────────────────────────

export function getProfile(pid: string): UserProfile {
  const raw = localStorage.getItem(profileKey(pid, 'PROFILE_DATA'));
  if (!raw) throw new Error('No profile found');
  return JSON.parse(raw);
}

export function updateProfile(
  pid: string,
  updates: Partial<Pick<UserProfile,
    'name' | 'equipment' | 'injuries' | 'goals' | 'experience_level' |
    'weekly_hours_available' | 'travel_mode' | 'api_key_configured' | 'onboarding_complete'
  >>
): void {
  const profile = getProfile(pid);
  const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
  localStorage.setItem(profileKey(pid, 'PROFILE_DATA'), JSON.stringify(updated));
}

// ── Schedule Preferences ──────────────────────────────────────────────

export function getSchedulePreferences(pid: string): SchedulePreference[] {
  return getArray<SchedulePreference>(pid, 'SCHEDULE');
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
  const schedule = getSchedulePreferences(pid);
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
  setArray(pid, 'SCHEDULE', schedule);
}

// ── Events ────────────────────────────────────────────────────────────

export function getEvents(pid: string): TrainingEvent[] {
  return getArray<TrainingEvent>(pid, 'EVENTS').sort(
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
  const events = getArray<TrainingEvent>(pid, 'EVENTS');
  const id = nextId();
  events.push({ ...event, id, created_at: new Date().toISOString() });
  setArray(pid, 'EVENTS', events);
  return id;
}

export function deleteEvent(pid: string, id: number): void {
  const events = getArray<TrainingEvent>(pid, 'EVENTS').filter((e) => e.id !== id);
  setArray(pid, 'EVENTS', events);
}

// ── Training Blocks ───────────────────────────────────────────────────

export function getTrainingBlocks(pid: string): TrainingBlock[] {
  return getArray<TrainingBlock>(pid, 'TRAINING_BLOCKS');
}

export function getCurrentBlock(pid: string): TrainingBlock | null {
  const today = getTodayISO();
  return getTrainingBlocks(pid).find(
    (b) => b.start_date <= today && b.end_date >= today
  ) || null;
}

export function saveTrainingBlocks(
  pid: string,
  blocks: Omit<TrainingBlock, 'id' | 'created_at'>[]
): void {
  const data = blocks.map((b) => ({
    ...b,
    id: nextId(),
    created_at: new Date().toISOString(),
  }));
  setArray(pid, 'TRAINING_BLOCKS', data);
}

// ── Workout Plans ─────────────────────────────────────────────────────

export function getWeekPlan(pid: string, weekStartDate: string): WorkoutPlan | null {
  const plans = getArray<WorkoutPlan>(pid, 'WORKOUT_PLANS');
  return plans.find((p) => p.week_start_date === weekStartDate) || null;
}

export function saveWeekPlan(
  pid: string,
  weekNumber: number,
  weekStartDate: string,
  planJson: string,
  generationContext: string = ''
): number {
  const plans = getArray<WorkoutPlan>(pid, 'WORKOUT_PLANS');
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
  setArray(pid, 'WORKOUT_PLANS', plans);
  return id;
}

// ── Workouts ──────────────────────────────────────────────────────────

function getAllWorkouts(pid: string): Workout[] {
  return getArray<Workout>(pid, 'WORKOUTS');
}

export function getTodayWorkouts(pid: string, date: string): Workout[] {
  return getAllWorkouts(pid)
    .filter((w) => w.date === date)
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));
}

export function getWeekWorkouts(pid: string, weekStart: string): Workout[] {
  const weekEnd = addDays(weekStart, 7);
  return getAllWorkouts(pid)
    .filter((w) => w.date >= weekStart && w.date < weekEnd)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time_slot.localeCompare(b.time_slot));
}

export function getWorkoutById(pid: string, id: number): Workout | null {
  return getAllWorkouts(pid).find((w) => w.id === id) || null;
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
    structured_data?: string;
  }>
): void {
  const all = getAllWorkouts(pid);
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
    };
    if (existingIdx >= 0) {
      all[existingIdx] = workout;
    } else {
      all.push(workout);
    }
  }
  setArray(pid, 'WORKOUTS', all);
}

export function updateWorkoutStatus(
  pid: string,
  id: number,
  status: 'completed' | 'skipped',
  skipReason: string = ''
): void {
  const all = getAllWorkouts(pid);
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return;
  all[idx].status = status;
  if (status === 'completed') {
    all[idx].completed_at = new Date().toISOString();
  } else {
    all[idx].skip_reason = skipReason;
  }
  setArray(pid, 'WORKOUTS', all);
}

export function updateWorkoutNotes(pid: string, id: number, notes: string): void {
  const all = getAllWorkouts(pid);
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return;
  all[idx].notes = notes;
  setArray(pid, 'WORKOUTS', all);
}

export function getRecentWorkouts(pid: string, days: number = 14): Workout[] {
  const cutoff = addDays(getTodayISO(), -days);
  return getAllWorkouts(pid)
    .filter((w) => w.date >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function updateWorkoutDetails(
  pid: string,
  id: number,
  updates: Partial<Pick<Workout, 'discipline' | 'title' | 'duration_minutes' | 'details' | 'time_slot'>>
): void {
  const all = getAllWorkouts(pid);
  const idx = all.findIndex((w) => w.id === id);
  if (idx < 0) return;
  Object.assign(all[idx], updates);
  setArray(pid, 'WORKOUTS', all);
}

// ── Chat Messages ─────────────────────────────────────────────────────

export function getChatMessages(pid: string, limit: number = 50): ChatMessage[] {
  const all = getArray<ChatMessage>(pid, 'CHAT_MESSAGES');
  // Return newest last (ascending), limited
  return all.slice(-limit);
}

export function saveChatMessage(
  pid: string,
  role: 'user' | 'assistant',
  content: string,
  contextSnapshot: string = ''
): number {
  const all = getArray<ChatMessage>(pid, 'CHAT_MESSAGES');
  const id = nextId();
  all.push({
    id,
    role,
    content,
    timestamp: new Date().toISOString(),
    context_snapshot: contextSnapshot,
  });
  setArray(pid, 'CHAT_MESSAGES', all);
  return id;
}

export function clearChatHistory(pid: string): void {
  setArray(pid, 'CHAT_MESSAGES', []);
}
