import { create } from 'zustand';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { loadUserData, clearCache } from '@/lib/dataSync';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  initialize: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  initialize: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await loadUserData(user.uid);
          set({ user, isLoading: false, error: null });
        } catch {
          set({ user: null, isLoading: false, error: 'Failed to load data' });
        }
      } else {
        clearCache();
        set({ user: null, isLoading: false });
      }
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Don't set user or load data here — onAuthStateChanged handles it
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      // Clean up Firebase error messages
      const cleanMsg = msg
        .replace('Firebase: ', '')
        .replace(/\(auth\/.*\)\.?/, '')
        .trim() || 'Invalid email or password';
      set({ isLoading: false, error: cleanMsg });
      throw new Error(cleanMsg);
    }
  },

  logout: async () => {
    await signOut(auth);
    clearCache();
    set({ user: null });
  },
}));
