import { create } from 'zustand';
import type { MoodEntry, MoodContext, WeightUnit } from '@/types';
import {
  getTodayMood,
  getWorkoutMood,
  getRecentMoodEntries,
  saveMoodEntry,
} from '@/storage/repository';
import { getTodayISO } from '@/utils/date';

interface MoodExtra {
  sleepHours?: number;
  stress?: number;
  restingHr?: number;
  weight?: number;
  weightUnit?: WeightUnit;
}

interface MoodStore {
  todayMood: MoodEntry | null;
  recentMood: MoodEntry[];
  moodError: string | null;

  loadTodayMood: (pid: string) => void;
  loadRecentMood: (pid: string) => void;
  checkWorkoutMood: (pid: string, workoutId: number) => MoodEntry | null;
  logMood: (
    pid: string,
    mood: number,
    energy: number,
    sleepQuality: number,
    context: MoodContext,
    workoutId?: number,
    extra?: MoodExtra
  ) => void;
  clearMoodError: () => void;
}

export const useMoodStore = create<MoodStore>((set) => ({
  todayMood: null,
  recentMood: [],
  moodError: null,

  loadTodayMood: (pid) => {
    try {
      const mood = getTodayMood(pid, getTodayISO());
      set({ todayMood: mood });
    } catch (err) {
      console.error('[useMoodStore] loadTodayMood failed:', err);
    }
  },

  loadRecentMood: (pid) => {
    try {
      set({ recentMood: getRecentMoodEntries(pid, 14) });
    } catch (err) {
      console.error('[useMoodStore] loadRecentMood failed:', err);
    }
  },

  checkWorkoutMood: (pid, workoutId) => {
    return getWorkoutMood(pid, workoutId);
  },

  logMood: (pid, mood, energy, sleepQuality, context, workoutId, extra) => {
    console.log('[useMoodStore] logMood called:', { pid, mood, energy, sleepQuality, context });
    set({ moodError: null });

    try {
      saveMoodEntry(pid, mood, energy, sleepQuality, context, workoutId, extra);
      console.log('[useMoodStore] saveMoodEntry succeeded');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save check-in';
      console.error('[useMoodStore] saveMoodEntry failed:', err);
      set({ moodError: msg });
      return;
    }

    // Build the entry directly from input instead of re-reading,
    // so state updates even if the read-back has issues
    const directEntry: MoodEntry = {
      id: Date.now(),
      date: getTodayISO(),
      mood,
      energy,
      sleep_quality: sleepQuality,
      context,
      created_at: new Date().toISOString(),
    };
    if (extra?.sleepHours != null) directEntry.sleep_hours = extra.sleepHours;
    if (extra?.stress != null) directEntry.stress = extra.stress;
    if (extra?.restingHr != null) directEntry.resting_hr = extra.restingHr;
    if (extra?.weight != null) directEntry.weight = extra.weight;
    if (extra?.weightUnit != null) directEntry.weight_unit = extra.weightUnit;
    if (workoutId != null) directEntry.workout_id = workoutId;

    // Try reading back from repo for accuracy, fallback to direct entry
    let savedMood: MoodEntry | null = directEntry;
    try {
      if (context === 'daily') {
        const fromRepo = getTodayMood(pid, getTodayISO());
        if (fromRepo) savedMood = fromRepo;
      }
    } catch (err) {
      console.error('[useMoodStore] getTodayMood read-back failed, using direct entry:', err);
    }

    let recentMood: MoodEntry[] = [];
    try {
      recentMood = getRecentMoodEntries(pid, 14);
    } catch (err) {
      console.error('[useMoodStore] getRecentMoodEntries failed:', err);
    }

    console.log('[useMoodStore] setting todayMood:', { context, savedMood: !!savedMood });
    if (context === 'daily') {
      set({ todayMood: savedMood, recentMood });
    } else {
      set({ recentMood });
    }
  },

  clearMoodError: () => set({ moodError: null }),
}));
