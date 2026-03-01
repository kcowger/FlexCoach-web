import { create } from 'zustand';
import type { UserProfile, SchedulePreference, TrainingEvent } from '@/types';
import type { ProfileSummary } from '@/storage/profiles';
import {
  getProfile,
  updateProfile as repoUpdateProfile,
  getSchedulePreferences,
  getEvents,
} from '@/storage/repository';
import { getProfiles, createProfile as dsCreateProfile, deleteProfile as dsDeleteProfile } from '@/lib/dataSync';

interface ProfileStore {
  profiles: ProfileSummary[];
  profile: UserProfile | null;
  schedule: SchedulePreference[];
  events: TrainingEvent[];

  loadProfiles: () => void;
  createProfile: (name: string) => string;
  deleteProfile: (id: string) => void;
  loadProfile: (pid: string) => void;
  updateProfile: (pid: string, updates: Partial<Pick<UserProfile,
    'name' | 'equipment' | 'injuries' | 'goals' | 'experience_level' |
    'weekly_hours_available' | 'travel_mode' | 'api_key_configured' | 'onboarding_complete' |
    'age' | 'weight' | 'weight_unit' | 'height_cm' | 'height_unit' | 'sex'
  >>) => void;
  loadSchedule: (pid: string) => void;
  loadEvents: (pid: string) => void;
}

export const useProfileStore = create<ProfileStore>((set) => ({
  profiles: [],
  profile: null,
  schedule: [],
  events: [],

  loadProfiles: () => {
    set({ profiles: getProfiles() });
  },

  createProfile: (name) => {
    const id = dsCreateProfile(name);
    set({ profiles: getProfiles() });
    return id;
  },

  deleteProfile: (id) => {
    dsDeleteProfile(id);
    set({ profiles: getProfiles() });
  },

  loadProfile: (pid) => {
    const profile = getProfile(pid);
    set({ profile });
  },

  updateProfile: (pid, updates) => {
    repoUpdateProfile(pid, updates);
    const profile = getProfile(pid);
    set({ profile });
    if (updates.name) {
      set({ profiles: getProfiles() });
    }
  },

  loadSchedule: (pid) => {
    set({ schedule: getSchedulePreferences(pid) });
  },

  loadEvents: (pid) => {
    set({ events: getEvents(pid) });
  },
}));
