export const STORAGE_KEYS = {
  PASSWORD_HASH: 'fc_password_hash',
  SESSION_TOKEN: 'fc_session',
  CLAUDE_API_KEY: 'fc_api_key',
  PROFILES: 'fc_profiles',
  ACTIVE_PROFILE: 'fc_active_profile',
  NEXT_ID: 'fc_next_id',
} as const;

// Per-profile key namespacing
const PROFILE_KEYS = {
  PROFILE_DATA: 'profile',
  SCHEDULE: 'schedule',
  EVENTS: 'events',
  TRAINING_BLOCKS: 'blocks',
  WORKOUT_PLANS: 'plans',
  WORKOUTS: 'workouts',
  CHAT_MESSAGES: 'chat',
} as const;

export function profileKey(profileId: string, key: keyof typeof PROFILE_KEYS): string {
  return `fc_p${profileId}_${PROFILE_KEYS[key]}`;
}

export function nextId(): number {
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_ID) || '0', 10);
  const next = current + 1;
  localStorage.setItem(STORAGE_KEYS.NEXT_ID, String(next));
  return next;
}
