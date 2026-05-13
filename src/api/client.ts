import { getApiBase } from '@/config/env';

// All backend controllers sit under /biz/api (see Spring Boot code).
export const API_PREFIX = '/biz/api';

type FetchOpts = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  sessionId?: string;
  tenantId?: string | number;
  query?: Record<string, string | number | boolean | undefined>;
  /** 跳过 401 自动登出（如登录接口本身） */
  skipAuthHandling?: boolean;
};

// 解耦：客户端不直接依赖 useAuth（避免循环依赖），由 App 启动时注入登出回调
type LogoutHandler = (reason: string) => void;
let logoutHandler: LogoutHandler | null = null;

/**
 * 注册 401 处理器（App 启动时由 useAuth 调用）。
 * 拦截器拿到 401 时调用该 handler 触发登出 + 跳登录页。
 */
export function registerLogoutHandler(handler: LogoutHandler) {
  logoutHandler = handler;
}

function classify401(message: string): string {
  if (message.includes('租户已停用')) return '租户已停用，请联系平台运营';
  if (message.includes('租户已到期')) return '租户已到期，请联系平台运营续费';
  if (message.includes('账号已在其它地方登录') || message.includes('已在其它地方登录')) {
    return '账号已在其它设备登录，本次会话失效';
  }
  return message || '会话已过期，请重新登录';
}

export async function api<T = any>(
  endpoint: string,
  opts: FetchOpts = {},
): Promise<T> {
  const { method = 'GET', body, sessionId, tenantId, query, skipAuthHandling } = opts;
  const qs = new URLSearchParams();
  if (sessionId) qs.set('sessionId', sessionId);
  if (tenantId != null) qs.set('tenantId', String(tenantId));
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) qs.set(k, String(v));
    }
  }
  const url = `${getApiBase()}${API_PREFIX}${endpoint}${qs.toString() ? `?${qs}` : ''}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Type': 'mobile',
    'X-Client-Version': '2.4.1',
  };
  if (sessionId) headers['X-Session-Id'] = sessionId;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));

  // 401 全局处理：分类原因 + 调度 App 登出（跳登录页）
  if (res.status === 401 && !skipAuthHandling) {
    const reason = classify401(json?.message || '');
    if (logoutHandler) {
      try { logoutHandler(reason); } catch { /* ignore */ }
    }
    const err = new Error(reason);
    (err as any).code = 401;
    (err as any).data = json;
    throw err;
  }

  if (!res.ok || json?.success === false) {
    const err = new Error(json?.message || `请求失败 (${res.status})`);
    (err as any).code = res.status;
    (err as any).data = json;
    throw err;
  }
  // Backend wraps in { success, message, data }
  return (json?.data ?? json) as T;
}
