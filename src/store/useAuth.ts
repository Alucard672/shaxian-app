import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserSession } from '@/api/auth';

interface AuthState {
  session: UserSession | null;
  loading: boolean;
  hydrate: () => Promise<void>;
  setSession: (s: UserSession | null) => Promise<void>;
  logout: () => Promise<void>;
}

const KEY = 'shaxian_session_v1';

export const useAuth = create<AuthState>((set) => ({
  session: null,
  loading: true,
  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      set({ session: raw ? JSON.parse(raw) : null, loading: false });
    } catch {
      set({ session: null, loading: false });
    }
  },
  setSession: async (s) => {
    if (s) await SecureStore.setItemAsync(KEY, JSON.stringify(s));
    else await SecureStore.deleteItemAsync(KEY);
    set({ session: s });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(KEY);
    set({ session: null });
  },
}));
