import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type {
  UserProfile,
  SchedulePreference,
  TrainingEvent,
  WorkoutPlan,
  Workout,
  ChatMessage,
  MoodEntry,
  Benchmarks,
} from '@/types';

// ── Types ────────────────────────────────────────────────────────────

export interface ProfileSummary {
  id: string;
  name: string;
  createdAt: string;
}

interface UserMeta {
  profiles: ProfileSummary[];
  apiKey: string;
}

interface ProfileDoc {
  profile: UserProfile;
  schedule: SchedulePreference[];
  events: TrainingEvent[];
  blocks: unknown[];
  plans: WorkoutPlan[];
  benchmarks: Benchmarks;
}

interface Cache {
  uid: string;
  meta: UserMeta;
  profiles: Record<string, ProfileDoc>;
  workouts: Record<string, Workout[]>;
  chat: Record<string, ChatMessage[]>;
  mood: Record<string, MoodEntry[]>;
}

// ── Cache ─────────────────────────────────────────────────────────────

let cache: Cache | null = null;

function requireCache(): Cache {
  if (!cache) throw new Error('Data not loaded. Please sign in first.');
  return cache;
}

export function nextId(): number {
  return Date.now() * 1000 + Math.floor(Math.random() * 1000);
}

// ── Firestore paths ──────────────────────────────────────────────────

function metaRef(uid: string) {
  return doc(db, 'users', uid);
}

function profileRef(uid: string, pid: string) {
  return doc(db, 'users', uid, 'profiles', pid);
}

function workoutsRef(uid: string, pid: string) {
  return doc(db, 'users', uid, 'workouts', pid);
}

function chatRef(uid: string, pid: string) {
  return doc(db, 'users', uid, 'chat', pid);
}

function moodRef(uid: string, pid: string) {
  return doc(db, 'users', uid, 'mood', pid);
}

// ── Load all data on login ───────────────────────────────────────────

export async function loadUserData(uid: string): Promise<void> {
  const metaSnap = await getDoc(metaRef(uid));
  const meta: UserMeta = metaSnap.exists()
    ? (metaSnap.data() as UserMeta)
    : { profiles: [], apiKey: '' };

  const profiles: Record<string, ProfileDoc> = {};
  const workouts: Record<string, Workout[]> = {};
  const chat: Record<string, ChatMessage[]> = {};
  const mood: Record<string, MoodEntry[]> = {};

  for (const p of meta.profiles) {
    const [profSnap, workSnap, chatSnap, moodSnap] = await Promise.all([
      getDoc(profileRef(uid, p.id)),
      getDoc(workoutsRef(uid, p.id)),
      getDoc(chatRef(uid, p.id)),
      getDoc(moodRef(uid, p.id)),
    ]);

    const profData = profSnap.exists()
      ? (profSnap.data() as ProfileDoc)
      : {
          profile: createDefaultProfile(p.id, p.name),
          schedule: [],
          events: [],
          blocks: [],
          plans: [],
          benchmarks: {},
        };
    // Ensure benchmarks field exists for older profiles
    if (!profData.benchmarks) profData.benchmarks = {};
    profiles[p.id] = profData as ProfileDoc;

    workouts[p.id] = workSnap.exists()
      ? ((workSnap.data() as { items: Workout[] }).items || [])
      : [];

    chat[p.id] = chatSnap.exists()
      ? ((chatSnap.data() as { messages: ChatMessage[] }).messages || [])
      : [];

    mood[p.id] = moodSnap.exists()
      ? ((moodSnap.data() as { entries: MoodEntry[] }).entries || [])
      : [];
  }

  cache = { uid, meta, profiles, workouts, chat, mood };
}

export function clearCache(): void {
  cache = null;
}

// ── Meta (profile list + API key) ────────────────────────────────────

export function getProfiles(): ProfileSummary[] {
  return requireCache().meta.profiles;
}

export function getApiKey(): string {
  return requireCache().meta.apiKey || '';
}

export function setApiKey(key: string): void {
  const c = requireCache();
  c.meta.apiKey = key;
  persistMeta();
}

export function createProfile(name: string): string {
  const c = requireCache();
  const id = String(nextId());
  c.meta.profiles.push({ id, name, createdAt: new Date().toISOString() });
  c.profiles[id] = {
    profile: createDefaultProfile(id, name),
    schedule: [],
    events: [],
    blocks: [],
    plans: [],
    benchmarks: {},
  };
  c.workouts[id] = [];
  c.chat[id] = [];
  c.mood[id] = [];

  persistMeta();
  persistProfile(id);
  persistWorkouts(id);
  persistChat(id);
  persistMood(id);
  return id;
}

export function deleteProfile(id: string): void {
  const c = requireCache();
  c.meta.profiles = c.meta.profiles.filter((p) => p.id !== id);
  delete c.profiles[id];
  delete c.workouts[id];
  delete c.chat[id];
  delete c.mood[id];

  persistMeta();
  // Note: Firestore docs for this profile will be orphaned but harmless
  // They'll be overwritten if the ID is ever reused (extremely unlikely)
}

// ── Profile data ─────────────────────────────────────────────────────

export function getProfileData(pid: string): UserProfile {
  const c = requireCache();
  const p = c.profiles[pid];
  if (!p) throw new Error('Profile not found');
  return p.profile;
}

export function updateProfileData(pid: string, updates: Partial<UserProfile>): void {
  const c = requireCache();
  const p = c.profiles[pid];
  if (!p) return;
  p.profile = { ...p.profile, ...updates, updated_at: new Date().toISOString() };

  // Also update name in meta list if changed
  if (updates.name) {
    const entry = c.meta.profiles.find((pr) => pr.id === pid);
    if (entry) {
      entry.name = updates.name;
      persistMeta();
    }
  }
  persistProfile(pid);
}

// ── Schedule ─────────────────────────────────────────────────────────

export function getSchedule(pid: string): SchedulePreference[] {
  return requireCache().profiles[pid]?.schedule || [];
}

export function setSchedule(pid: string, schedule: SchedulePreference[]): void {
  const c = requireCache();
  if (!c.profiles[pid]) return;
  c.profiles[pid].schedule = schedule;
  persistProfile(pid);
}

// ── Events ───────────────────────────────────────────────────────────

export function getEvents(pid: string): TrainingEvent[] {
  return requireCache().profiles[pid]?.events || [];
}

export function setEvents(pid: string, events: TrainingEvent[]): void {
  const c = requireCache();
  if (!c.profiles[pid]) return;
  c.profiles[pid].events = events;
  persistProfile(pid);
}

// ── Plans ────────────────────────────────────────────────────────────

export function getPlans(pid: string): WorkoutPlan[] {
  return requireCache().profiles[pid]?.plans || [];
}

export function setPlans(pid: string, plans: WorkoutPlan[]): void {
  const c = requireCache();
  if (!c.profiles[pid]) return;
  c.profiles[pid].plans = plans;
  persistProfile(pid);
}

// ── Benchmarks ──────────────────────────────────────────────────────

export function getBenchmarksData(pid: string): Benchmarks {
  return requireCache().profiles[pid]?.benchmarks || {};
}

export function setBenchmarksData(pid: string, benchmarks: Benchmarks): void {
  const c = requireCache();
  if (!c.profiles[pid]) return;
  c.profiles[pid].benchmarks = { ...benchmarks, updated_at: new Date().toISOString() };
  persistProfile(pid);
}

// ── Workouts ─────────────────────────────────────────────────────────

export function getWorkouts(pid: string): Workout[] {
  return requireCache().workouts[pid] || [];
}

export function setWorkouts(pid: string, workouts: Workout[]): void {
  const c = requireCache();
  c.workouts[pid] = workouts;
  persistWorkouts(pid);
}

// ── Chat ─────────────────────────────────────────────────────────────

export function getChatData(pid: string): ChatMessage[] {
  return requireCache().chat[pid] || [];
}

const MAX_CHAT_MESSAGES = 200;

export function setChatData(pid: string, messages: ChatMessage[]): void {
  const c = requireCache();
  // Cap stored messages to prevent unbounded Firestore document growth
  c.chat[pid] = messages.length > MAX_CHAT_MESSAGES
    ? messages.slice(-MAX_CHAT_MESSAGES)
    : messages;
  persistChat(pid);
}

// ── Mood ──────────────────────────────────────────────────────────────

export function getMoodData(pid: string): MoodEntry[] {
  return requireCache().mood[pid] || [];
}

export function setMoodData(pid: string, entries: MoodEntry[]): void {
  const c = requireCache();
  c.mood[pid] = entries;
  persistMood(pid);
}

// ── Sync error tracking ──────────────────────────────────────────────

let lastSyncError: string | null = null;

export function getSyncError(): string | null {
  return lastSyncError;
}

export function clearSyncError(): void {
  lastSyncError = null;
}

function handleSyncError(context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  lastSyncError = `Failed to sync ${context}: ${msg}`;
  console.error(`[dataSync] ${lastSyncError}`);
}

// ── Persistence (background writes with error tracking) ──────────────

function persistMeta(): void {
  const c = cache;
  if (!c) return;
  setDoc(metaRef(c.uid), c.meta).catch((e) => handleSyncError('account data', e));
}

function persistProfile(pid: string): void {
  const c = cache;
  if (!c || !c.profiles[pid]) return;
  setDoc(profileRef(c.uid, pid), c.profiles[pid]).catch((e) => handleSyncError('profile', e));
}

function persistWorkouts(pid: string): void {
  const c = cache;
  if (!c) return;
  setDoc(workoutsRef(c.uid, pid), { items: c.workouts[pid] || [] }).catch((e) => handleSyncError('workouts', e));
}

function persistChat(pid: string): void {
  const c = cache;
  if (!c) return;
  setDoc(chatRef(c.uid, pid), { messages: c.chat[pid] || [] }).catch((e) => handleSyncError('chat', e));
}

function persistMood(pid: string): void {
  const c = cache;
  if (!c) return;
  setDoc(moodRef(c.uid, pid), { entries: c.mood[pid] || [] }).catch((e) => handleSyncError('mood', e));
}

// ── Helpers ──────────────────────────────────────────────────────────

function createDefaultProfile(id: string, name: string): UserProfile {
  return {
    id: Number(id) || 0,
    name,
    api_key_configured: 0,
    equipment: '{}',
    injuries: '[]',
    goals: '',
    experience_level: 'beginner',
    weekly_hours_available: 6,
    travel_mode: 0,
    onboarding_complete: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
