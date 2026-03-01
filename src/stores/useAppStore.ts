import { create } from 'zustand';

interface AppStore {
  activeProfileId: string | null;
  isLoading: boolean;
  error: string | null;
  setActiveProfile: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeProfileId: null,
  isLoading: false,
  error: null,
  setActiveProfile: (id) => set({ activeProfileId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
