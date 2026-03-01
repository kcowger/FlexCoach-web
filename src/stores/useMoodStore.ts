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
}

export const useMoodStore = create<MoodStore>((set) => ({
  todayMood: null,
  recentMood: [],

  loadTodayMood: (pid) => {
    const mood = getTodayMood(pid, getTodayISO());
    set({ todayMood: mood });
  },

  loadRecentMood: (pid) => {
    set({ recentMood: getRecentMoodEntries(pid, 14) });
  },

  checkWorkoutMood: (pid, workoutId) => {
    return getWorkoutMood(pid, workoutId);
  },

  logMood: (pid, mood, energy, sleepQuality, context, workoutId, extra) => {
    saveMoodEntry(pid, mood, energy, sleepQuality, context, workoutId, extra);
    const todayMood = getTodayMood(pid, getTodayISO());
    const recentMood = getRecentMoodEntries(pid, 14);
    set({ todayMood, recentMood });
  },
}));
