import { create } from 'zustand';
import { STORAGE_KEYS } from '@/storage/keys';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSessionToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface AuthStore {
  isUnlocked: boolean;
  hasPassword: boolean;
  initialize: () => void;
  setPassword: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isUnlocked: false,
  hasPassword: false,

  initialize: () => {
    const hasHash = !!localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
    const sessionToken = sessionStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);

    // Auto-unlock if session exists and password is set
    const isUnlocked = hasHash && !!sessionToken;

    set({ hasPassword: hasHash, isUnlocked });
  },

  setPassword: async (password: string) => {
    const hash = await hashPassword(password);
    localStorage.setItem(STORAGE_KEYS.PASSWORD_HASH, hash);

    const token = generateSessionToken();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);

    set({ hasPassword: true, isUnlocked: true });
  },

  unlock: async (password: string) => {
    const storedHash = localStorage.getItem(STORAGE_KEYS.PASSWORD_HASH);
    if (!storedHash) return false;

    const inputHash = await hashPassword(password);

    // Constant-time comparison to prevent timing attacks
    if (inputHash.length !== storedHash.length) return false;
    let mismatch = 0;
    for (let i = 0; i < inputHash.length; i++) {
      mismatch |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
    }
    if (mismatch !== 0) return false;

    const token = generateSessionToken();
    sessionStorage.setItem(STORAGE_KEYS.SESSION_TOKEN, token);

    set({ isUnlocked: true });
    return true;
  },

  lock: () => {
    sessionStorage.removeItem(STORAGE_KEYS.SESSION_TOKEN);
    set({ isUnlocked: false });
  },
}));
