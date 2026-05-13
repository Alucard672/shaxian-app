import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// ─── Environment definitions ────────────────────────────────────────────
// 走 nginx 反代（https），而不是直连后端 IP+端口：
//   - HTTPS 保护 sessionId / 密码不被中间人嗅探
//   - 享受 nginx 的连接复用 / no-cache 头等策略
//   - 防火墙关 8082 时移动端仍能通过 443 访问

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
    apiBase: 'https://t.jiyizhiyun.com',
    note: '阿里云测试服（nginx 反代）',
  },
  prod: {
    key: 'prod',
    label: '正式',
    apiBase: 'https://jiyizhiyun.com', // 生产域名（已配 nginx + SSL）
    note: '生产环境',
  },
};

const DEFAULT_ENV: EnvKey = (process.env.EXPO_PUBLIC_ENV as EnvKey) ?? 'test';
const OVERRIDE_KEY = 'shaxian_env_override_v1';

interface State {
  current: EnvConfig;
  hydrated: boolean;
  listeners: Set<() => void>;
}

const state: State = {
  current: ENVS[DEFAULT_ENV],
  hydrated: false,
  listeners: new Set(),
};

export function getApiBase(): string {
  return state.current.apiBase;
}

export function getCurrentEnv(): EnvConfig {
  return state.current;
}

export async function hydrateEnv() {
  if (state.hydrated) return;
  try {
    const envKey = await SecureStore.getItemAsync(OVERRIDE_KEY);
    if (envKey && ENVS[envKey as EnvKey]) {
      state.current = ENVS[envKey as EnvKey];
    }
  } catch {}
  state.hydrated = true;
  state.listeners.forEach(fn => fn());
}

export async function switchEnv(key: EnvKey) {
  state.current = ENVS[key];
  await SecureStore.setItemAsync(OVERRIDE_KEY, key);
  state.listeners.forEach(fn => fn());
}

export function subscribeEnv(fn: () => void): () => void {
  state.listeners.add(fn);
  return () => { state.listeners.delete(fn); };
}
