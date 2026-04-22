import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ─── Environment definitions ────────────────────────────────────────────
// Test server info comes from backend deploy_test.sh — IP 120.27.148.45:8082.
// Production stays as a placeholder until a prod host is in place.

export type EnvKey = 'local' | 'test' | 'prod';

export interface EnvConfig {
  key: EnvKey;
  label: string;
  apiBase: string;
  note?: string;
}

const LOCAL_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const ENVS: Record<EnvKey, EnvConfig> = {
  local: {
    key: 'local',
    label: '本地',
    apiBase: LOCAL_BASE,
    note: 'iOS→localhost · Android→10.0.2.2',
  },
  test: {
    key: 'test',
    label: '测试',
    apiBase: 'http://120.27.148.45:8082',
    note: '阿里云测试服',
  },
  prod: {
    key: 'prod',
    label: '生产',
    apiBase: 'http://t.jiyizhiyun.com/biz-prod', // placeholder — update when prod is ready
    note: '正式环境',
  },
};

// Priority: runtime override (SecureStore) > EXPO_PUBLIC_API_BASE env > default env
const DEFAULT_ENV: EnvKey = (process.env.EXPO_PUBLIC_ENV as EnvKey) ?? 'test';
const OVERRIDE_KEY = 'shaxian_env_override_v1';
const CUSTOM_BASE_KEY = 'shaxian_custom_base_v1';

interface State {
  current: EnvConfig;
  customBase: string | null;
  hydrated: boolean;
  listeners: Set<() => void>;
}

const state: State = {
  current: ENVS[DEFAULT_ENV],
  customBase: null,
  hydrated: false,
  listeners: new Set(),
};

export function getApiBase(): string {
  if (state.customBase) return state.customBase;
  return state.current.apiBase;
}

export function getCurrentEnv(): EnvConfig & { customBase: string | null } {
  return { ...state.current, customBase: state.customBase };
}

export async function hydrateEnv() {
  if (state.hydrated) return;
  try {
    const [envKey, custom] = await Promise.all([
      SecureStore.getItemAsync(OVERRIDE_KEY),
      SecureStore.getItemAsync(CUSTOM_BASE_KEY),
    ]);
    if (envKey && ENVS[envKey as EnvKey]) {
      state.current = ENVS[envKey as EnvKey];
    } else if (process.env.EXPO_PUBLIC_API_BASE) {
      // Env var from .env — treat as custom
      state.customBase = process.env.EXPO_PUBLIC_API_BASE;
    }
    state.customBase = custom || state.customBase;
  } catch {}
  state.hydrated = true;
  state.listeners.forEach(fn => fn());
}

export async function switchEnv(key: EnvKey) {
  state.current = ENVS[key];
  state.customBase = null;
  await Promise.all([
    SecureStore.setItemAsync(OVERRIDE_KEY, key),
    SecureStore.deleteItemAsync(CUSTOM_BASE_KEY),
  ]);
  state.listeners.forEach(fn => fn());
}

export async function setCustomBase(url: string | null) {
  state.customBase = url;
  if (url) await SecureStore.setItemAsync(CUSTOM_BASE_KEY, url);
  else await SecureStore.deleteItemAsync(CUSTOM_BASE_KEY);
  state.listeners.forEach(fn => fn());
}

export function subscribeEnv(fn: () => void): () => void {
  state.listeners.add(fn);
  return () => { state.listeners.delete(fn); };
}
