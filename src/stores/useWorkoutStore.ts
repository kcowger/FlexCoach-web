import { create } from 'zustand';
import type { Workout, GeneratedPlan } from '@/types';
import {
  getTodayWorkouts,
  getWeekWorkouts,
  updateWorkoutStatus as repoUpdateStatus,
  updateWorkoutNotes as repoUpdateNotes,
  updateWorkoutDetails as repoUpdateDetails,
  updateWorkoutPostData as repoUpdatePostData,
} from '@/storage/repository';
import { generateWeekPlan } from '@/services/planGenerator';
import { getTodayISO, getWeekStartISO } from '@/utils/date';

interface WorkoutStore {
  todayWorkouts: Workout[];
  weekWorkouts: Workout[];
  isGenerating: boolean;
  generationError: string | null;

  loadToday: (pid: string, date?: string) => void;
  loadWeek: (pid: string, weekStart?: string) => void;
  markComplete: (pid: string, workoutId: number) => void;
  markSkipped: (pid: string, workoutId: number, reason: string) => void;
  updateNotes: (pid: string, workoutId: number, notes: string) => void;
  generateWeek: (pid: string, weekStart?: string) => Promise<GeneratedPlan>;
  applyWorkoutUpdate: (pid: string, workoutId: number, changes: Record<string, unknown>) => void;
  updatePostWorkoutData: (pid: string, workoutId: number, rpe: number, actualDuration: number) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  todayWorkouts: [],
  weekWorkouts: [],
  isGenerating: false,
  generationError: null,

  loadToday: (pid, date) => {
    const workouts = getTodayWorkouts(pid, date || getTodayISO());
    set({ todayWorkouts: workouts });
  },

  loadWeek: (pid, weekStart) => {
    const ws = weekStart || getWeekStartISO();
    const workouts = getWeekWorkouts(pid, ws);
    set({ weekWorkouts: workouts });
  },

  markComplete: (pid, workoutId) => {
    repoUpdateStatus(pid, workoutId, 'completed');
    get().loadToday(pid);
    get().loadWeek(pid);
  },

  markSkipped: (pid, workoutId, reason) => {
    repoUpdateStatus(pid, workoutId, 'skipped', reason);
    get().loadToday(pid);
    get().loadWeek(pid);
  },

  updateNotes: (pid, workoutId, notes) => {
    repoUpdateNotes(pid, workoutId, notes);
    get().loadToday(pid);
  },

  generateWeek: async (pid, weekStart) => {
    set({ isGenerating: true, generationError: null });
    try {
      const plan = await generateWeekPlan(pid, weekStart);
      get().loadToday(pid);
      get().loadWeek(pid, weekStart);
      return plan;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Plan generation failed';
      set({ generationError: msg });
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },

  applyWorkoutUpdate: (pid, workoutId, changes) => {
    const updates: Record<string, unknown> = {};
    if (changes.discipline) updates.discipline = changes.discipline;
    if (changes.title) updates.title = changes.title;
    if (changes.details) updates.details = changes.details;
    if (changes.durationMinutes) updates.duration_minutes = changes.durationMinutes;
    if (changes.timeSlot) updates.time_slot = changes.timeSlot;

    if (Object.keys(updates).length > 0) {
      repoUpdateDetails(pid, workoutId, updates as Record<string, string | number>);
      get().loadToday(pid);
      get().loadWeek(pid);
    }
  },

  updatePostWorkoutData: (pid, workoutId, rpe, actualDuration) => {
    repoUpdatePostData(pid, workoutId, rpe, actualDuration);
    get().loadToday(pid);
    get().loadWeek(pid);
  },
}));
