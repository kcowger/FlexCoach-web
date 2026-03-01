import { create } from 'zustand';
import type { MoodEntry, MoodContext } from '@/types';
import {
  getTodayMood,
  getWorkoutMood,
  getRecentMoodEntries,
  saveMoodEntry,
} from '@/storage/repository';
import { getTodayISO } from '@/utils/date';

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
    workoutId?: number
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

  logMood: (pid, mood, energy, sleepQuality, context, workoutId) => {
    saveMoodEntry(pid, mood, energy, sleepQuality, context, workoutId);
    const todayMood = getTodayMood(pid, getTodayISO());
    const recentMood = getRecentMoodEntries(pid, 14);
    set({ todayMood, recentMood });
  },
}));
