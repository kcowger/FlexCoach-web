import { create } from 'zustand';
import type { Workout, TrainingBlock, GeneratedPlan } from '@/types';
import {
  getTodayWorkouts,
  getWeekWorkouts,
  updateWorkoutStatus as repoUpdateStatus,
  updateWorkoutNotes as repoUpdateNotes,
  updateWorkoutDetails as repoUpdateDetails,
  getCurrentBlock,
} from '@/storage/repository';
import { generateWeekPlan, generateBlockOutline } from '@/services/planGenerator';
import { getTodayISO, getWeekStartISO } from '@/utils/date';

interface WorkoutStore {
  todayWorkouts: Workout[];
  weekWorkouts: Workout[];
  currentBlock: TrainingBlock | null;
  isGenerating: boolean;
  generationError: string | null;

  loadToday: (pid: string) => void;
  loadWeek: (pid: string, weekStart?: string) => void;
  loadCurrentBlock: (pid: string) => void;
  markComplete: (pid: string, workoutId: number) => void;
  markSkipped: (pid: string, workoutId: number, reason: string) => void;
  updateNotes: (pid: string, workoutId: number, notes: string) => void;
  generateBlock: (pid: string) => Promise<void>;
  generateWeek: (pid: string, weekStart?: string) => Promise<GeneratedPlan>;
  applyWorkoutUpdate: (pid: string, workoutId: number, changes: Record<string, unknown>) => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  todayWorkouts: [],
  weekWorkouts: [],
  currentBlock: null,
  isGenerating: false,
  generationError: null,

  loadToday: (pid) => {
    const workouts = getTodayWorkouts(pid, getTodayISO());
    set({ todayWorkouts: workouts });
  },

  loadWeek: (pid, weekStart) => {
    const ws = weekStart || getWeekStartISO();
    const workouts = getWeekWorkouts(pid, ws);
    set({ weekWorkouts: workouts });
  },

  loadCurrentBlock: (pid) => {
    const block = getCurrentBlock(pid);
    set({ currentBlock: block });
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

  generateBlock: async (pid) => {
    set({ isGenerating: true, generationError: null });
    try {
      await generateBlockOutline(pid);
      const block = getCurrentBlock(pid);
      set({ currentBlock: block });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Block generation failed';
      set({ generationError: msg });
      throw error;
    } finally {
      set({ isGenerating: false });
    }
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
}));
