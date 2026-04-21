import { Platform } from 'react-native';

// Backend URL — local dev:
// iOS simulator can use localhost, Android emulator uses 10.0.2.2
// For physical device, replace with your LAN IP (e.g. 192.168.1.100)
const DEFAULT_BASE =
  Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080';

export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? DEFAULT_BASE;
// All backend controllers sit under /biz/api (see Spring Boot code).
export const API_PREFIX = '/biz/api';

type FetchOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  sessionId?: string;
  tenantId?: string | number;
  query?: Record<string, string | number | boolean | undefined>;
};

export async function api<T = any>(
  endpoint: string,
  opts: FetchOpts = {},
): Promise<T> {
  const { method = 'GET', body, sessionId, tenantId, query } = opts;
  const qs = new URLSearchParams();
  if (sessionId) qs.set('sessionId', sessionId);
  if (tenantId != null) qs.set('tenantId', String(tenantId));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) qs.set(k, String(v));
    }
  }
  const url = `${API_BASE}${API_PREFIX}${endpoint}${qs.toString() ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.success === false) {
    const err = new Error(json?.message || `请求失败 (${res.status})`);
    (err as any).code = res.status;
    (err as any).data = json;
    throw err;
  }
  // Backend wraps in { success, message, data }
  return (json?.data ?? json) as T;
}
