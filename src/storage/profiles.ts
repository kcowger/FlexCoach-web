import { STORAGE_KEYS, profileKey, nextId } from './keys';
import type { UserProfile } from '@/types';
import { DEFAULT_EQUIPMENT, DEFAULT_INJURIES, DEFAULT_GOALS } from '@/constants/defaults';

export interface ProfileSummary {
  id: string;
  name: string;
  createdAt: string;
}

export function getProfiles(): ProfileSummary[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILES) || '[]');
}

export function createProfile(name: string): string {
  const id = String(nextId());
  const profiles = getProfiles();
  profiles.push({ id, name, createdAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

  // Seed default data for this profile
  const defaultProfile: UserProfile = {
    id: parseInt(id, 10),
    name,
    api_key_configured: localStorage.getItem(STORAGE_KEYS.CLAUDE_API_KEY) ? 1 : 0,
    equipment: JSON.stringify(DEFAULT_EQUIPMENT),
    injuries: JSON.stringify(DEFAULT_INJURIES),
    goals: DEFAULT_GOALS,
    experience_level: 'returning',
    weekly_hours_available: 8.0,
    travel_mode: 0,
    onboarding_complete: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  localStorage.setItem(profileKey(id, 'PROFILE_DATA'), JSON.stringify(defaultProfile));
  localStorage.setItem(profileKey(id, 'SCHEDULE'), '[]');
  localStorage.setItem(profileKey(id, 'EVENTS'), '[]');
  localStorage.setItem(profileKey(id, 'TRAINING_BLOCKS'), '[]');
  localStorage.setItem(profileKey(id, 'WORKOUT_PLANS'), '[]');
  localStorage.setItem(profileKey(id, 'WORKOUTS'), '[]');
  localStorage.setItem(profileKey(id, 'CHAT_MESSAGES'), '[]');

  return id;
}

export function deleteProfile(id: string): void {
  const profiles = getProfiles().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

  // Clean up all profile data
  const keys: Array<Parameters<typeof profileKey>[1]> = [
    'PROFILE_DATA', 'SCHEDULE', 'EVENTS', 'TRAINING_BLOCKS',
    'WORKOUT_PLANS', 'WORKOUTS', 'CHAT_MESSAGES',
  ];
  for (const key of keys) {
    localStorage.removeItem(profileKey(id, key));
  }
}

export function getActiveProfileId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROFILE);
}

export function setActiveProfileId(id: string): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_PROFILE, id);
}
