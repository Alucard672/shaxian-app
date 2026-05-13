import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { UserSession } from '@/api/auth';

interface AuthState {
  session: UserSession | null;
  loading: boolean;
  /** 上一次被强制登出的原因（顶号 / 到期 / 停用 / 普通过期）；登录页读取展示 */
  logoutReason: string | null;
  hydrate: () => Promise<void>;
  setSession: (s: UserSession | null) => Promise<void>;
  logout: (reason?: string) => Promise<void>;
  clearLogoutReason: () => void;
}

const KEY = 'shaxian_session_v1';

export const useAuth = create<AuthState>((set) => ({
  session: null,
  loading: true,
  logoutReason: null,
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
    set({ session: s, logoutReason: null });
  },
  logout: async (reason) => {
    await SecureStore.deleteItemAsync(KEY);
    set({ session: null, logoutReason: reason ?? null });
  },
  clearLogoutReason: () => set({ logoutReason: null }),
}));
